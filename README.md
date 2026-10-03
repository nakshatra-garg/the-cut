# The Cut

Training plan, daily habits and weigh-in tracker (127.4 → 105 kg). Static site: no build step.

## Deploy to GitHub Pages

```bash
gh repo create the-cut --public --source=. --push
gh api -X POST repos/{owner}/the-cut/pages -f "source[branch]=main" -f "source[path]=/"
```

The site appears at `https://<username>.github.io/the-cut/` within a minute or two.
(Pages on a private repo needs a paid plan. The repo holds only the app code, never your data.)

## Install on your phone

Open the URL in Safari → Share → **Add to Home Screen**. Open the app from the home-screen icon after that.

## Turn on sync

1. Create a classic token with only the `gist` scope:
   https://github.com/settings/tokens/new?scopes=gist&description=The%20Cut%20app
2. In the app: **Sync & backup** → paste the token → **Connect**.

Entries are saved on the phone first (works offline), then copied to a private gist
named `cut-plan-data.json` in your account. On a new phone, connect with a token and
your history is pulled down automatically.

> iOS keeps the home-screen app's storage separate from Safari's. Connect sync
> **inside the installed app**, not in a Safari tab.

## Evening reminder

A GitHub Action ([reminder.yml](.github/workflows/reminder.yml)) runs every 15 minutes. If it's past
your reminder time and today isn't closed, it sends a push notification to your phone.

One-time setup (two repo secrets):

- `VAPID_PRIVATE_KEY`: the push signing key (already set). Its public half is in `index.html` and `remind.mjs`.
- `GIST_TOKEN`: a classic token with only the `gist` scope, so the Action can read your data gist.

Then in the app, opened from the home-screen icon: **Evening reminder** → pick a time → **Turn on**.

Send a test notification:

```bash
gh workflow run reminder.yml -f force=true
```

## Updating the app

Edit `index.html`, bump `VERSION` in `sw.js` (e.g. `thecut-v2`), commit and push.
The phone picks up the new version on the next launch or the one after.

Plan content (exercises, habits, start/goal weights) is at the top of the `<script>` in `index.html`.
