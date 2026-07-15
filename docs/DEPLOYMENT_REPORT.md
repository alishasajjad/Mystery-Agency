# Deployment Report — Mystery Agency

**Date:** 2026-07-15
See `DEPLOYMENT_GUIDE.md` for step-by-step commands; this report is the readiness assessment.

## Build validation (exact)

| Check | Command | Exit |
|---|---|---|
| Type-check | `npm run type-check` | **0** ✅ |
| Lint | `npm run lint` | **0** ✅ |
| Build | `npm run build` | **0** ✅ |
| Deploy gate | `type-check && lint` | **pass** ✅ |

Artifacts: `dist/client/game.html`, `dist/client/splash.html`, `dist/server/index.cjs` present. `console.log` in `src` = 0.

## Devvit configuration (`devvit.json`) — verified

- Inline entry `splash.html`, expanded entry `game.html`, server `index.cjs`.
- Moderator menu item "Create a new Mystery Agency post".
- `onAppInstall` trigger → seeds 10 chapters + opening submission phase (auto-progression on).
- `dev.subreddit` for playtest.

## Install & runtime flow

1. App installed on a subreddit → `onAppInstall` seeds story/phase.
2. Moderator creates a game post via the subreddit menu.
3. Players open the post → splash → expanded Phaser game.
4. Phases auto-advance every 12h; moderators can override/pause/skip.

## Readiness by area

| Area | Status |
|---|---|
| Client/server build | ✅ green |
| Devvit entrypoints/menu/trigger | ✅ configured |
| Moderator authz (server-enforced) | ✅ |
| Public player flow | ✅ (one-per-chapter, phase-gated) |
| Automatic + manual progression | ✅ |
| Privacy/Terms content | ✅ (URLs = manual GitHub Pages step) |
| Live Devvit playtest | ⏳ requires your Reddit credentials |
| Automated tests | ❌ none (roadmap) |

## Cannot be done from here (requires your credentials)

`devvit login`, `devvit playtest`, `devvit upload`, `devvit publish` all require an authenticated Reddit Developer session that is not available in this environment. **The build is publish-ready; the publish itself is yours to run:**

```bash
npm run login
npm run dev            # playtest on your dev subreddit
npm run deploy         # type-check && lint && devvit upload
npm run launch         # deploy && devvit publish (App Directory review)
```

## Blockers

**None for building/uploading.** Before a wide public launch, complete: (1) a **live playtest**, (2) publish **Privacy/Terms URLs** via GitHub Pages, (3) ideally add **automated tests**.

**Status:** ✅ deployment-ready build; final publish + playtest are owner-run steps.
