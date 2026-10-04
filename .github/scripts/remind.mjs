// Sends the evening "close your day" push. Runs every 15 min from reminder.yml.
// Reads settings (time, timezone, push subscription) from push.json in the private data repo,
// and skips days that are already closed (data.json, decrypted with DATA_PASSPHRASE).
import webpush from 'web-push';

const VAPID_PUBLIC = 'BMGx86N2Apj1n5afkZPF1YhIbtAS44ahMVLJtaJfJFV2R1bBMhvlwJa4SjDluY8Z49PYlTtfewh7nxBri2eYpf4';
const SITE = 'https://nakshatra-garg.github.io/the-cut/';
const DATA = 'data.json', PUSH = 'push.json', PROTEIN_MIN = 175, PROTEIN_DONE = 158;   // 90% counts
const { DATA_TOKEN, DATA_REPO, VAPID_PRIVATE_KEY, DATA_PASSPHRASE, FORCE } = process.env;
const force = FORCE === 'true';

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
  log(`Local ${date} ${now} (${push.tz}), reminder at ${push.time}`);

  let data = (await read(DATA)) || {}, locked = false;
  if (data.enc){
    if (!DATA_PASSPHRASE){ console.log('::warning::Data is encrypted but DATA_PASSPHRASE secret is not set. Sending a generic reminder.'); data = {}; locked = true; }
    else {
      try { data = await decrypt(data); }
      catch (e) { console.log('::warning::DATA_PASSPHRASE does not match the app passphrase. Sending a generic reminder.'); data = {}; locked = true; }
    }
  }
  if (!force){
    if (now < (push.time || '21:00')){ log('Not time yet.'); process.exit(0); }
    if (push.lastSent === date){ log('Already reminded today.'); process.exit(0); }
    if (data.closed && data.closed[date]){ log('Day already closed.'); process.exit(0); }
  }

  const g = data.protein && data.protein[date];
  const weighed = data.weights && typeof data.weights[date] === 'number';
  const bits = locked ? [] : [
    typeof g === 'number' ? `Protein ${g} g${g >= PROTEIN_DONE ? ' ✓' : ` of ${PROTEIN_MIN}`}` : 'Protein not logged',
    weighed ? 'weigh-in ✓' : 'no weigh-in yet'
  ];
  const payload = JSON.stringify({ title: 'Time to close your day 🔒', body: locked ? "If today isn't closed yet, tick off what you did and keep the streak going." : `${bits.join(' · ')}. Tick off what you did and keep the streak going.`, url: SITE });

  webpush.setVapidDetails(SITE, VAPID_PUBLIC, VAPID_PRIVATE_KEY);
  try {
    await webpush.sendNotification(push.subscription, payload, { TTL: 3 * 3600, urgency: 'high' });
    log('Reminder sent.');
    if (!force) push.lastSent = date;
  } catch (e) {
    if (e.statusCode === 404 || e.statusCode === 410){
      push.enabled = false; push.expired = true;
      log('Subscription expired. The app will ask you to turn reminders on again.');
    } else throw e;
  }
  await gh(`/repos/${DATA_REPO}/contents/${PUSH}`, { method: 'PUT', body: JSON.stringify({
    message: 'Reminder sent', sha: sha[PUSH], content: Buffer.from(JSON.stringify(push)).toString('base64') }) });
} catch (e) {
  warn(e.message);
}
