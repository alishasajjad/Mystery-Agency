# Release Checklist — Mystery Agency

**Date:** 2026-07-15 · Legend: ✅ done · ⏳ owner-run · ❌ not yet

## Code & build

- [x] `npm run type-check` → 0 errors
- [x] `npm run lint` → 0 errors
- [x] `npm run build` → success (client + server artifacts)
- [x] No `console.log` / dead audio controls / dead code in `src`
- [x] Backend organized into `services/` (game logic) + `routes/` (transport)

## Gameplay

- [x] 10-chapter campaign (*The Red Fox Files*, two books)
- [x] Hybrid phase engine: automatic 12h progression + full manual override
- [x] Admin: pause/resume auto, skip phase, manual set, advance, auto-canon, reset
- [x] One theory per chapter (server 409 + client button state)
- [x] Chapter labels on every theory (list + canon)
- [x] Phase + countdown indicators on Menu / Evidence / List / Admin
- [x] Phase-change notifications (toasts)
- [x] XP / ranks / badges / leaderboards / profile intact
- [x] Phase state persists in Redis across restarts

## UI/UX

- [x] Settings audio inconsistency resolved (removed; real settings added)
- [x] Context-aware primary action on Evidence
- [x] Responsive `Scale.FIT`; mobile DOM input; iframe-safe (no `alert/confirm`)
- [x] Event-wired cleanup (no orphaned DOM/listeners)

## Compliance

- [x] `privacy.md` + `terms.md` (root), linked in README + in-game
- [x] Data handling matches implementation
- [ ] ⏳ Public Privacy/Terms **URLs** live via GitHub Pages (enable Pages, paste into app listing)

## Documentation

- [x] README updated (10 chapters, hybrid phases, one-per-chapter, endpoints, legal)
- [x] Guides: GAMEPLAY_GUIDE, ADMIN_GUIDE, DEPLOYMENT_GUIDE, PROJECT_ARCHITECTURE
- [x] Reports: UPDATED_GAMEPLAY, CONTENT_EXPANSION, UI_POLISH, DEPLOYMENT, PRIVACY_COMPLIANCE, FINAL_RELEASE, this checklist

## Deploy (owner-run — needs Reddit credentials)

- [ ] ⏳ `npm run login`
- [ ] ⏳ `npm run dev` — live playtest on a subreddit you moderate
- [ ] ⏳ Verify: submit one theory (second blocked), auto-advance after 12h, admin pause/skip, notifications
- [ ] ⏳ `npm run deploy` → `npm run launch`
- [ ] ⏳ Enable GitHub Pages; submit Privacy/Terms URLs to the App Directory

## Post-launch hardening (roadmap)

- [ ] ❌ Automated test suite (vitest)
- [ ] ❌ Atomic multi-key Redis writes (`watch`/multi) for vote/submit/phase-tick
- [ ] ❌ Rate limiting on public routes
- [ ] ❌ Server-scheduled phase ticks (true cron) instead of lazy-on-read

**Bottom line:** all code/content/compliance/documentation items are ✅; the remaining ⏳ items are owner-run deploy/hosting steps that require your Reddit + GitHub accounts.
