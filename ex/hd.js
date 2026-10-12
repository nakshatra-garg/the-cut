/* HD exercise demos, made on the phone.
   The demo GIFs only exist at 180×180 (© Gym visual). This runs Real-ESRGAN "animevideov3" (BSD-3, Xintao Wang,
   see ex/sr/LICENSE) on the GPU with WebGL2 to redraw every frame at 720×720, then keeps the result on this
   device (IndexedDB) so each exercise is only processed once. Nothing is uploaded or redistributed.
   Model: conv3×3 3→64, PReLU, 16 × (conv3×3 64→64, PReLU), conv3×3 64→48, pixel-shuffle ×4, + nearest-upscaled input. */
(() => {
  const N = 180, S = 4, OUT = N * S, GROUPS = 16, LAYERS = 18;
  const DB_NAME = 'thecut-hd', STORE = 'frames', MAX_ITEMS = 60;

  /* ---------- GIF decoding: every frame composited to a full 180×180 RGBA image, with its delay ---------- */
  function lzw(data, minCode, pixelCount){
    const out = new Uint8Array(pixelCount), clear = 1 << minCode, eoi = clear + 1;
    const prefix = new Uint16Array(4096), suffix = new Uint8Array(4096), stack = new Uint8Array(4097);
    let size = minCode + 1, mask = (1 << size) - 1, next = eoi + 1, old = -1, first = 0, bits = 0, cur = 0, op = 0;
    for (let i = 0; i < clear; i++){ prefix[i] = 0; suffix[i] = i; }
    for (let p = 0; p < data.length && op < pixelCount; ){
      if (bits < size){ cur |= data[p++] << bits; bits += 8; continue; }
      let code = cur & mask; cur >>= size; bits -= size;
      if (code === clear){ size = minCode + 1; mask = (1 << size) - 1; next = eoi + 1; old = -1; continue; }
      if (code === eoi) break;
      if (old === -1){ out[op++] = suffix[code]; old = first = code; continue; }
      const in_ = code; let sp = 0;
      if (code >= next){ stack[sp++] = first; code = old; }
      while (code > eoi){ stack[sp++] = suffix[code]; code = prefix[code]; }
      first = suffix[code]; stack[sp++] = first;
      while (sp && op < pixelCount) out[op++] = stack[--sp];
      if (next < 4096){ prefix[next] = old; suffix[next] = first; next++; if ((next & mask) === 0 && next < 4096){ size++; mask = (1 << size) - 1; } }
      old = in_;
    }
    return out;
  }
  function decodeGif(buf){
    const b = new Uint8Array(buf); let p = 6;
    const W = b[p] | b[p + 1] << 8, H = b[p + 2] | b[p + 3] << 8, flags = b[p + 4]; p += 7;
    let gct = null;
    if (flags & 0x80){ const n = 3 << ((flags & 7) + 1); gct = b.subarray(p, p + n); p += n; }
    const canvas = new Uint8ClampedArray(W * H * 4).fill(255), frames = [];
    let delay = 100, trans = -1, dispose = 0;
    while (p < b.length){
      const k = b[p++];
      if (k === 0x3B) break;
      if (k === 0x21){
        const label = b[p++];
        if (label === 0xF9){ const f = b[p + 1]; dispose = (f >> 2) & 7; delay = ((b[p + 2] | b[p + 3] << 8) || 10) * 10; trans = f & 1 ? b[p + 4] : -1; }
        while (b[p]) p += b[p] + 1; p++;
        continue;
      }
      if (k !== 0x2C) break;
      const x0 = b[p] | b[p + 1] << 8, y0 = b[p + 2] | b[p + 3] << 8, w = b[p + 4] | b[p + 5] << 8, h = b[p + 6] | b[p + 7] << 8, f = b[p + 8]; p += 9;
      let ct = gct;
      if (f & 0x80){ const n = 3 << ((f & 7) + 1); ct = b.subarray(p, p + n); p += n; }
      const minCode = b[p++], parts = []; let len = 0;
      while (b[p]){ parts.push(b.subarray(p + 1, p + 1 + b[p])); len += b[p]; p += b[p] + 1; } p++;
      const data = new Uint8Array(len); let o = 0; for (const s of parts){ data.set(s, o); o += s.length; }
      const idx = lzw(data, minCode, w * h), before = dispose === 3 ? canvas.slice() : null;
      const rowOf = (f & 0x40) ? (() => { const r = []; for (const [s, st] of [[0, 8], [4, 8], [2, 4], [1, 2]]) for (let y = s; y < h; y += st) r.push(y); return r; })() : null;
      for (let i = 0; i < h; i++){
        const y = y0 + (rowOf ? rowOf[i] : i); if (y >= H) continue;
        for (let x = 0; x < w; x++){
          const c = idx[i * w + x]; if (c === trans || x0 + x >= W) continue;
          const d = (y * W + x0 + x) * 4; canvas[d] = ct[c * 3]; canvas[d + 1] = ct[c * 3 + 1]; canvas[d + 2] = ct[c * 3 + 2]; canvas[d + 3] = 255;
        }
      }
      frames.push({ rgba: canvas.slice(), delay: Math.max(20, delay) });
      if (dispose === 2) for (let y = y0; y < y0 + h && y < H; y++) canvas.fill(255, (y * W + x0) * 4, (y * W + Math.min(W, x0 + w)) * 4);
      else if (dispose === 3 && before) canvas.set(before);
      trans = -1; dispose = 0; delay = 100;
    }
    return { W, H, frames };
  }

  /* ---------- The network on the GPU ---------- */
  const VS = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
  // One 3×3 conv layer. Activations are 16 groups of 4 channels tiled side by side (group g at x = g*N).
  const CONV = `#version 300 es
precision highp float; precision highp int;
uniform highp sampler2D act; uniform highp sampler2D wt; uniform int IG, ROW, ACT; out vec4 o;
void main(){
  ivec2 q = ivec2(gl_FragCoord.xy); int og = q.x / ${N}, x = q.x - og * ${N}, y = q.y, r = ROW + og;
  vec4 acc = texelFetch(wt, ivec2(576, r), 0);
  for (int ig = 0; ig < ${GROUPS}; ig++){
    if (ig >= IG) break;
    for (int t = 0; t < 9; t++){
      int sx = x + t % 3 - 1, sy = y + t / 3 - 1;
      if (sx < 0 || sy < 0 || sx >= ${N} || sy >= ${N}) continue;
      vec4 a = texelFetch(act, ivec2(ig * ${N} + sx, sy), 0);
      int c = (ig * 9 + t) * 4;
      acc += mat4(texelFetch(wt, ivec2(c, r), 0), texelFetch(wt, ivec2(c + 1, r), 0), texelFetch(wt, ivec2(c + 2, r), 0), texelFetch(wt, ivec2(c + 3, r), 0)) * a;
    }
  }
  if (ACT == 1){ vec4 al = texelFetch(wt, ivec2(577, r), 0); acc = max(acc, 0.) + al * min(acc, 0.); }
  o = acc;
}`;
  // Pixel shuffle (DepthToSpace, CRD) + the nearest-upscaled input, written top row first for readPixels.
  const SHUFFLE = `#version 300 es
precision highp float; precision highp int;
uniform highp sampler2D act; uniform highp sampler2D img; out vec4 o;
void main(){
  ivec2 q = ivec2(gl_FragCoord.xy); int x = q.x / ${S}, y = q.y / ${S}, dx = q.x % ${S}, dy = q.y % ${S};
  vec3 c;
  for (int ci = 0; ci < 3; ci++){ int ch = ci * 16 + dy * 4 + dx; c[ci] = texelFetch(act, ivec2((ch / 4) * ${N} + x, y), 0)[ch % 4]; }
  o = vec4(clamp(c + texelFetch(img, ivec2(x, y), 0).rgb, 0., 1.), 1.);
}`;

  let ctx = null, weightsP = null;
  function gpu(){
    if (ctx) return ctx;
    const cv = document.createElement('canvas'); cv.width = cv.height = 1;
    const gl = cv.getContext('webgl2', { antialias:false, depth:false, alpha:false, powerPreference:'high-performance' });
    if (!gl || !gl.getExtension('EXT_color_buffer_float') && !gl.getExtension('EXT_color_buffer_half_float')) throw new Error('no float render targets');
    const prog = fs => {
      const pr = gl.createProgram();
      for (const [type, src] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]]){
        const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
        gl.attachShader(pr, sh);
      }
      gl.bindAttribLocation(pr, 0, 'p'); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
      return pr;
    };
    const tex = (w, h, fmt, type, internal, data = null) => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, fmt, type, data); return t;
    };
    const fbo = t => { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return f; };
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const conv = prog(CONV), shuffle = prog(SHUFFLE);
    const A = [0, 1].map(() => tex(N * GROUPS, N, gl.RGBA, gl.HALF_FLOAT, gl.RGBA16F));
    const img = tex(N, N, gl.RGBA, gl.UNSIGNED_BYTE, gl.RGBA8), out = tex(OUT, OUT, gl.RGBA, gl.UNSIGNED_BYTE, gl.RGBA8);
    ctx = { gl, conv, shuffle, A, fA: A.map(fbo), img, out, fOut: fbo(out), wt: null,
      u: { IG: gl.getUniformLocation(conv, 'IG'), ROW: gl.getUniformLocation(conv, 'ROW'), ACT: gl.getUniformLocation(conv, 'ACT'),
           act: gl.getUniformLocation(conv, 'act'), wt: gl.getUniformLocation(conv, 'wt'),
           sAct: gl.getUniformLocation(shuffle, 'act'), sImg: gl.getUniformLocation(shuffle, 'img') }, tex };
    return ctx;
  }
  function weights(){
    return weightsP || (weightsP = fetch('ex/sr/w.bin').then(r => { if (!r.ok) throw new Error('weights ' + r.status); return r.arrayBuffer(); })
      .then(buf => { const c = gpu(); c.wt = c.tex(578, 284, c.gl.RGBA, c.gl.HALF_FLOAT, c.gl.RGBA16F, new Uint16Array(buf)); return c; })
      .catch(e => { weightsP = null; throw e; }));
  }
  // One frame: 18 conv passes ping-ponging between two textures, then the shuffle. Returns 720×720 RGBA bytes.
  function upscale(c, rgba){
    const { gl, u } = c;
    gl.bindTexture(gl.TEXTURE_2D, c.img); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N, N, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
    gl.useProgram(c.conv); gl.uniform1i(u.act, 0); gl.uniform1i(u.wt, 1);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, c.wt);
    let src = c.img, dst = 0;
    for (let l = 0; l < LAYERS; l++){
      const OG = l === LAYERS - 1 ? 12 : 16;
      gl.bindFramebuffer(gl.FRAMEBUFFER, c.fA[dst]); gl.viewport(0, 0, N * OG, N);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src);
      gl.uniform1i(u.IG, l === 0 ? 1 : 16); gl.uniform1i(u.ROW, l * 16); gl.uniform1i(u.ACT, l < LAYERS - 1 ? 1 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      src = c.A[dst]; dst ^= 1;
    }
    gl.useProgram(c.shuffle); gl.uniform1i(u.sAct, 0); gl.uniform1i(u.sImg, 1);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, c.img);
    gl.bindFramebuffer(gl.FRAMEBUFFER, c.fOut); gl.viewport(0, 0, OUT, OUT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    const px = new Uint8Array(OUT * OUT * 4); gl.readPixels(0, 0, OUT, OUT, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return new Uint8ClampedArray(px.buffer);
  }

  /* ---------- On-device cache: JPEG frames per GIF, oldest dropped past MAX_ITEMS ---------- */
  const db = () => new Promise((res, rej) => { const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const tx = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => {
    const t = d.transaction(STORE, mode), out = fn(t.objectStore(STORE)); t.oncomplete = () => res(out.result); t.onerror = () => rej(t.error); }); };
  const cacheGet = id => tx('readonly', s => s.get(id)).catch(() => null);
  async function cachePut(id, val){
    try {
      await tx('readwrite', s => s.put(val, id));
      const keys = await tx('readonly', s => s.getAllKeys());
      if (keys.length > MAX_ITEMS){
        const all = await Promise.all(keys.map(async k => [k, (await cacheGet(k))?.at || 0]));
        all.sort((a, b) => a[1] - b[1]);
        await tx('readwrite', s => { for (const [k] of all.slice(0, keys.length - MAX_ITEMS)) s.delete(k); return s.count(); });
      }
    } catch(e) {}   // storage full or private mode: it just isn't cached
  }
  const toBlob = cv => new Promise(res => cv.toBlob(res, 'image/jpeg', .9));

  /* ---------- Player: draws the HD frames into the demo box, crossfading in over the sharpened GIF ---------- */
  function play(box, frames){
    let cv = box.querySelector('canvas.exhd');
    if (!cv){ cv = document.createElement('canvas'); cv.className = 'exhd'; cv.setAttribute('aria-hidden', 'true'); box.appendChild(cv); }
    cv.width = cv.height = OUT;
    const g = cv.getContext('2d'); let i = 0, t0 = performance.now(), acc = 0;
    g.drawImage(frames[0].bmp, 0, 0);
    void cv.offsetWidth; box.classList.add('hd');   // commit the transparent state first so the fade runs
    const tick = now => {
      if (!cv.isConnected || box.closest('[hidden]')){ frames.forEach(f => f.bmp.close?.()); return; }
      requestAnimationFrame(tick);
      acc += now - t0; t0 = now;
      if (acc < frames[i].delay) return;
      acc -= frames[i].delay; if (acc > 500) acc = 0;
      i = (i + 1) % frames.length; g.drawImage(frames[i].bmp, 0, 0);
    };
    requestAnimationFrame(tick);
  }

  const busy = new Map();
  window.hdGif = async function(box, url, id){
    if (!box || !box.isConnected) return;
    try {
      const hit = await cacheGet(id);
      if (hit && hit.frames?.length){
        const frames = await Promise.all(hit.frames.map(async (blob, k) => ({ bmp: await createImageBitmap(blob), delay: hit.delays[k] })));
        if (box.isConnected){ play(box, frames); cachePut(id, { ...hit, at: Date.now() }); }
        return;
      }
      if (busy.has(id)) return;
      busy.set(id, true);
      const [gif, c] = await Promise.all([fetch(url).then(r => { if (!r.ok) throw new Error('gif ' + r.status); return r.arrayBuffer(); }).then(decodeGif), weights()]);
      if (gif.W !== N || gif.H !== N) throw new Error('unexpected size');
      box.classList.add('hdwork');
      const tmp = document.createElement('canvas'); tmp.width = tmp.height = OUT; const tg = tmp.getContext('2d');
      const frames = [], blobs = [];
      for (const [k, f] of gif.frames.entries()){
        const px = upscale(c, f.rgba);
        tg.putImageData(new ImageData(px, OUT, OUT), 0, 0);
        const blob = await toBlob(tmp);
        blobs.push(blob); frames.push({ bmp: await createImageBitmap(blob), delay: f.delay });
        box.style.setProperty('--hd', ((k + 1) / gif.frames.length).toFixed(2));
        await new Promise(r => setTimeout(r, 0));   // let the page breathe between frames
      }
      box.classList.remove('hdwork');
      cachePut(id, { frames: blobs, delays: frames.map(f => f.delay), at: Date.now() });
      if (box.isConnected) play(box, frames);
    } catch(e){
      box.classList.remove('hdwork');   // WebGL2 / float targets / network missing: the sharpened GIF stays
      console.warn('HD demo unavailable:', e.message);
    } finally { busy.delete(id); }
  };
  window.hdGifInternals = { decodeGif, weights, upscale };   // for testing
})();
