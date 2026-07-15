# Privacy & Compliance Report — Mystery Agency

**Date:** 2026-07-15

## Documents

- **`privacy.md`** (repo root) — production Privacy Policy.
- **`terms.md`** (repo root) — production Terms & Conditions.
- Both are **linked from `README.md`** (Privacy & Terms section + TOC) and summarized in-game (**Settings → Privacy & Terms**).

## Data-handling facts (verified against code)

| Question | Answer | Evidence |
|---|---|---|
| What identifies a player? | Reddit user id + username from Devvit `context` | `services/auth.ts`, `routes/api.ts` |
| What gameplay data is stored? | XP, rank, badges, theories, votes, streak, dates | `services/redis.ts`, `shared/types.ts` |
| Where is it stored? | Reddit Devvit-managed Redis | `@devvit/web/server` `redis` |
| Any emails/passwords/payments? | **No** | no such fields anywhere in `src` |
| Third-party analytics/ads/trackers? | **No** | no external network calls except same-origin `/api` |
| Local device data? | `localStorage`: notification marker + optional admin-UI flag | `client/phase.ts`, `MainMenu.ts` |
| Deletion? | Moderator **Reset Game** clears game state; local data via Settings | `services/story-init.ts` `resetStory`, `SettingsScene` |

The policy content matches the implementation — no over- or under-claiming.

## Devvit App Directory requirements

The App Directory requires **public Privacy Policy and Terms URLs**. This repo ships the documents; to produce the URLs:

1. Push the repo to GitHub.
2. **Settings → Pages →** deploy from branch (root).
3. Use `https://<user>.github.io/<repo>/privacy` and `.../terms` (GitHub Pages renders `privacy.md`/`terms.md`).
4. Paste both URLs into the Devvit app listing.

> These URLs cannot be generated here (they depend on your GitHub account/repo). The **content is ready**; only hosting is a manual step.

## Compliance checklist

- [x] Privacy Policy present, accurate, root-level
- [x] Terms & Conditions present, accurate, root-level
- [x] Linked from README + surfaced in-game
- [x] No collection of sensitive personal data
- [x] No third-party tracking
- [x] Fair-play rules stated (one-per-chapter, no cheating/abuse)
- [x] Moderator reset / data-clearing documented
- [x] Defers to Reddit's Privacy Policy & User Agreement for platform matters
- [ ] Public GitHub Pages URLs live (manual: enable Pages, paste into app listing)

**Status:** ✅ compliance content production-ready; one manual hosting step remains for the App Directory URLs.
