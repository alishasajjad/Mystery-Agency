# Mystery Agency — Deployment Guide

How to build, playtest, deploy, and launch the game on Reddit's Devvit platform.

---

## Prerequisites

- **Node.js ≥ 22.2.0**
- A **Reddit account** with Developer access
- The **Devvit CLI** (installed via `npm install`)
- **Moderator** access to the subreddit you'll test/run on (admin controls are mod-only)

## 1. Install & log in

```bash
npm install
npm run login          # authenticate the Devvit CLI with Reddit
```

## 2. Configure the dev subreddit

Edit `devvit.json`:

```json
{ "dev": { "subreddit": "your_dev_subreddit" } }
```

Use a subreddit **you moderate** so the Admin panel is available to you.

## 3. Verify the build locally

```bash
npm run type-check     # tsc --build            → must be 0 errors
npm run lint           # eslint src             → must be 0 errors
npm run build          # vite build → dist/client + dist/server
```

## 4. Playtest

```bash
npm run dev            # devvit playtest on your dev subreddit (live reload)
```

Open the created post on your dev subreddit and run through the flow:
splash → game → evidence → submit theory → theories → (mod: open voting) → vote → (mod: auto-canon) → canon → (mod: advance).

## 5. Deploy

```bash
npm run deploy         # type-check && lint && devvit upload
```

`deploy` refuses to upload unless `type-check` and `lint` are clean.

## 6. Launch (public)

```bash
npm run launch         # deploy && devvit publish  (submits for Reddit review)
```

After review approval, the app can be installed on subreddits from the Reddit Developer portal.

---

## `devvit.json` reference

| Key | Value | Purpose |
|---|---|---|
| `post.entrypoints.default` | `splash.html` (inline) | feed view |
| `post.entrypoints.game` | `game.html` (expanded) | full game |
| `server.entry` | `index.cjs` | Hono server bundle |
| `menu.items[0]` | "Create a new Mystery Agency post" | moderator-only menu action |
| `triggers.onAppInstall` | `/internal/triggers/on-app-install` | seeds story on install |
| `dev.subreddit` | your dev sub | playtest target |

## Permissions & install flow

- On install, the `onAppInstall` trigger seeds the story (5 chapters + submission phase) automatically.
- Moderators create a game post via the subreddit menu → "Create a new Mystery Agency post".
- No custom OAuth scopes or secrets are required beyond standard Devvit.

## Environment variables

**None.** Devvit manages configuration through `devvit.json`. A local `.env` is git-ignored and not needed.

## Subreddit configuration requirements

- Install the app on a subreddit you moderate.
- Moderators automatically get the in-game **🛠️ ADMIN** panel (server-verified).
- Regular members get the full player experience with no admin controls.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `deploy` fails at lint | Run `npm run lint` (script is `eslint src`, Windows-safe). |
| **ADMIN button not visible** | You must be a **moderator** of the subreddit in `dev.subreddit`. Mod status is per-subreddit. Check the server log line from `GET /api/admin/status`. |
| Admin action returns 403 | Same cause — server verified you are not a moderator. |
| No chapter loads | `GET /api/chapter` self-heals via `initializeStory`; otherwise confirm the app installed (the install trigger seeds data). |
| "Theory submission is closed" | A moderator must set the phase to **submission** (Admin → Open Submissions). |
| Voting disabled | Phase must be **voting** (Admin → Open Voting). |
| Text box not visible on mobile | It's a native `<textarea>` over the canvas — tap it to focus and raise the keyboard. |

## Production checklist

- [ ] `npm run type-check`, `npm run lint`, `npm run build` all pass
- [ ] Playtested the full loop on a dev subreddit you moderate
- [ ] Confirmed the ADMIN panel appears for you and phases/canon/advance work
- [ ] Confirmed a non-mod account sees the normal player flow (no admin)
- [ ] `devvit.json` dev subreddit set correctly
- [ ] `npm run deploy` succeeds; `npm run launch` when ready for review
