// Sends two pushes, each at most once a day. Runs every 15 min from reminder.yml.
//  - Morning weigh-in (default 06:30), skipped once today's weight is logged.
//  - Evening "close your day" (default 21:00), skipped once the day is closed.
// Reads settings (times, timezone, push subscription) from push.json in the private data repo,
// and today's entries from data.json (decrypted with DATA_PASSPHRASE).
import webpush from 'web-push';

const VAPID_PUBLIC = 'BMGx86N2Apj1n5afkZPF1YhIbtAS44ahMVLJtaJfJFV2R1bBMhvlwJa4SjDluY8Z49PYlTtfewh7nxBri2eYpf4';
const SITE = 'https://nakshatra-garg.github.io/the-cut/';
const DATA = 'data.json', PUSH = 'push.json', PROTEIN_MIN = 175, PROTEIN_DONE = 158;   // 90% counts
const { DATA_TOKEN, DATA_REPO, VAPID_PRIVATE_KEY, DATA_PASSPHRASE, FORCE, KIND } = process.env;
const force = FORCE === 'true', forceKind = KIND === 'morning' ? 'morning' : 'evening';
const addHours = (hm, h) => { const [a, b] = hm.split(':').map(Number); return `${String(Math.min(23, a + h)).padStart(2, '0')}:${String(b).padStart(2, '0')}`; };

const log = m => console.log(m);
// Warnings instead of failures: a red run every 15 minutes would flood your inbox.
const warn = m => { console.log(`::warning::${m}`); process.exit(0); };

// Same scheme as the app: PBKDF2-SHA256 → AES-GCM-256.
async function decrypt(env){
  const subtle = globalThis.crypto.subtle, b = s => Buffer.from(s, 'base64');
  const base = await subtle.importKey('raw', new TextEncoder().encode(DATA_PASSPHRASE), 'PBKDF2', false, ['deriveKey']);
  const key = await subtle.deriveKey({ name:'PBKDF2', salt: b(env.salt), iterations: env.iter, hash:'SHA-256' }, base, { name:'AES-GCM', length:256 }, false, ['decrypt']);
  return JSON.parse(new TextDecoder().decode(await subtle.decrypt({ name:'AES-GCM', iv: b(env.iv) }, key, b(env.ct))));
}

async function gh(path, opts = {}){
  const r = await fetch('https://api.github.com' + path, { ...opts, headers: {
    Authorization: `Bearer ${DATA_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' } });
  if (r.status === 404 && opts.optional) return null;
  if (!r.ok) throw new Error(`GitHub ${r.status} on ${path}`);
  return r.json();
}

if (!DATA_TOKEN || !VAPID_PRIVATE_KEY) warn('DATA_TOKEN or VAPID_PRIVATE_KEY secret is not set. See README.');

try {
  const sha = {};
  const read = async name => {
    const f = await gh(`/repos/${DATA_REPO}/contents/${name}`, { optional: true });
    if (!f) return null;
    sha[name] = f.sha;
    return JSON.parse(Buffer.from(f.content, 'base64').toString('utf8'));
  };

  const push = await read(PUSH);
  if (!push || !push.enabled || !push.subscription){ log('Reminders are off.'); process.exit(0); }

  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: push.tz || 'UTC',
    year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23' })
    .formatToParts(new Date()).map(p => [p.type, p.value]));
  const date = `${parts.year}-${parts.month}-${parts.day}`, now = `${parts.hour}:${parts.minute}`;
  // A missing "morning" block means on at 06:30, so existing setups get it without touching the app.
  const morning = { on: !push.morning || push.morning.enabled !== false, time: (push.morning && push.morning.time) || '06:30' };
  const evening = { on: push.evening !== false, time: push.time || '21:00' };
  log(`Local ${date} ${now} (${push.tz}). Weigh-in ${morning.on ? morning.time : 'off'}, close day ${evening.on ? evening.time : 'off'}.`);

  // Weighing later in the day reads heavy, so the morning nudge stops 4 hours after its time.
  let wantMorning = force ? forceKind === 'morning' : morning.on && now >= morning.time && now < addHours(morning.time, 4) && push.lastMorning !== date;
  let wantEvening = force ? forceKind === 'evening' : evening.on && now >= evening.time && push.lastSent !== date;
  if (!wantMorning && !wantEvening){ log('Nothing due.'); process.exit(0); }

  let data = (await read(DATA)) || {}, locked = false;
  if (data.enc){
    if (!DATA_PASSPHRASE){ console.log('::warning::Data is encrypted but DATA_PASSPHRASE secret is not set. Sending a generic reminder.'); data = {}; locked = true; }
    else {
      try { data = await decrypt(data); }
      catch (e) { console.log('::warning::DATA_PASSPHRASE does not match the app passphrase. Sending a generic reminder.'); data = {}; locked = true; }
    }
  }
  const weighed = data.weights && typeof data.weights[date] === 'number';
  if (!force){
    if (wantMorning && weighed){ log('Already weighed in today.'); wantMorning = false; push.lastMorning = date; }
    if (wantEvening && data.closed && data.closed[date]){ log('Day already closed.'); wantEvening = false; }
  }

  const sends = [];
  if (wantMorning){
    const ws = [];
    for (let k = 1; k <= 7; k++){
      const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - k);
      const v = data.weights && data.weights[d.toISOString().slice(0, 10)];
      if (typeof v === 'number') ws.push(v);
    }
    const avg = ws.length ? ws.reduce((a, b) => a + b, 0) / ws.length : null;
    sends.push(['morning', { title: 'Morning weigh-in ⚖️', tag: 'weigh-in', url: SITE + '?weigh=1',
      body: `Bathroom first, then the scale, before food or water.${avg ? ` Your 7-day average is ${avg.toFixed(1)} kg.` : ''}` }]);
  }
  if (wantEvening){
    const g = data.protein && data.protein[date];
    const bits = [
      typeof g === 'number' ? `Protein ${g} g${g >= PROTEIN_DONE ? ' ✓' : ` of ${PROTEIN_MIN}`}` : 'Protein not logged',
      weighed ? 'weigh-in ✓' : 'no weigh-in yet'
    ];
    sends.push(['evening', { title: 'Time to close your day 🔒', tag: 'close-day', url: SITE,
      body: locked ? "If today isn't closed yet, tick off what you did and keep the streak going." : `${bits.join(' · ')}. Tick off what you did and keep the streak going.` }]);
  }

  webpush.setVapidDetails(SITE, VAPID_PUBLIC, VAPID_PRIVATE_KEY);
  for (const [kind, payload] of sends){
    try {
      await webpush.sendNotification(push.subscription, JSON.stringify(payload), { TTL: 3 * 3600, urgency: 'high' });
      log(`${kind === 'morning' ? 'Weigh-in' : 'Close-day'} reminder sent.`);
      if (!force){ if (kind === 'morning') push.lastMorning = date; else push.lastSent = date; }
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410){
        push.enabled = false; push.expired = true;
        log('Subscription expired. The app will ask you to turn reminders on again.');
        break;
      } else throw e;
    }
  }
  await gh(`/repos/${DATA_REPO}/contents/${PUSH}`, { method: 'PUT', body: JSON.stringify({
    message: 'Reminder sent', sha: sha[PUSH], content: Buffer.from(JSON.stringify(push)).toString('base64') }) });
} catch (e) {
  warn(e.message);
}
