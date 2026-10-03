// Sends the evening "close your day" push. Runs every 15 min from reminder.yml.
// Reads settings (time, timezone, push subscription) from cut-push.json in the same
// private gist the app syncs to, and skips days that are already closed.
import webpush from 'web-push';

const VAPID_PUBLIC = 'BMGx86N2Apj1n5afkZPF1YhIbtAS44ahMVLJtaJfJFV2R1bBMhvlwJa4SjDluY8Z49PYlTtfewh7nxBri2eYpf4';
const SITE = 'https://nakshatra-garg.github.io/the-cut/';
const DATA = 'cut-plan-data.json', PUSH = 'cut-push.json', PROTEIN_MIN = 175;
const { GIST_TOKEN, VAPID_PRIVATE_KEY, FORCE } = process.env;
const force = FORCE === 'true';

const log = m => console.log(m);
// Warnings instead of failures: a red run every 15 minutes would flood your inbox.
const warn = m => { console.log(`::warning::${m}`); process.exit(0); };

async function gh(path, opts = {}){
  const r = await fetch('https://api.github.com' + path, { ...opts, headers: {
    Authorization: `Bearer ${GIST_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' } });
  if (!r.ok) throw new Error(`GitHub ${r.status} on ${path}`);
  return r.json();
}

if (!GIST_TOKEN || !VAPID_PRIVATE_KEY) warn('GIST_TOKEN or VAPID_PRIVATE_KEY secret is not set. See README.');

try {
  let gist = null;
  for (let page = 1; page <= 10 && !gist; page++){
    const list = await gh(`/gists?per_page=100&page=${page}`);
    gist = list.find(g => g.files && g.files[DATA]);
    if (list.length < 100) break;
  }
  if (!gist) warn('No synced data gist found. Connect sync in the app first.');
  const full = await gh(`/gists/${gist.id}`);
  const read = async f => {
    const x = full.files[f]; if (!x) return null;
    return JSON.parse(x.truncated ? await (await fetch(x.raw_url)).text() : x.content);
  };

  const push = await read(PUSH);
  if (!push || !push.enabled || !push.subscription){ log('Reminders are off.'); process.exit(0); }

  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: push.tz || 'UTC',
    year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23' })
    .formatToParts(new Date()).map(p => [p.type, p.value]));
  const date = `${parts.year}-${parts.month}-${parts.day}`, now = `${parts.hour}:${parts.minute}`;
  log(`Local ${date} ${now} (${push.tz}), reminder at ${push.time}`);

  const data = (await read(DATA)) || {};
  if (!force){
    if (now < (push.time || '21:00')){ log('Not time yet.'); process.exit(0); }
    if (push.lastSent === date){ log('Already reminded today.'); process.exit(0); }
    if (data.closed && data.closed[date]){ log('Day already closed.'); process.exit(0); }
  }

  const g = data.protein && data.protein[date];
  const weighed = data.weights && typeof data.weights[date] === 'number';
  const bits = [
    typeof g === 'number' ? `Protein ${g} g${g >= PROTEIN_MIN ? ' ✓' : ` of ${PROTEIN_MIN}`}` : 'Protein not logged',
    weighed ? 'weigh-in ✓' : 'no weigh-in yet'
  ];
  const payload = JSON.stringify({ title: 'Time to close your day 🔒', body: `${bits.join(' · ')}. Tick off what you did and keep the streak going.`, url: SITE });

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
  await gh(`/gists/${gist.id}`, { method: 'PATCH', body: JSON.stringify({ files: { [PUSH]: { content: JSON.stringify(push) } } }) });
} catch (e) {
  warn(e.message);
}
