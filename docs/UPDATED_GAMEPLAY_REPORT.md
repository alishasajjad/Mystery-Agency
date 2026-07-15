# Updated Gameplay Report — Mystery Agency

**Date:** 2026-07-15
Covers the mechanics changed/added this pass. Evidence cited by file. Validated by `type-check`/`lint`/`build` = 0/0/pass. Not a live playtest (needs Reddit credentials).

## 1. Hybrid phase system (automatic + manual)

`src/server/services/phase.ts` + `redis.ts` + `routes/api.ts`.

- **Automatic:** phases auto-advance every **12 hours** — `submission → voting → (canon reveal + next chapter) → submission …`, ending in `closed` on the finale. Implemented as a **lazy tick** in `resolvePhase()`: on any read, if `auto && now ≥ ends_at`, it performs exactly one guarded transition and persists it. State (phase, `ends_at`, `started_at`, `auto`, `chapter`) lives in Redis and **survives restarts**.
- **Canon reveal on voting-end:** `advanceFromVoting()` canonizes the top-voted theory (shared `canonizeTheory()` — reused by admin routes, no duplication), awards +100 XP, updates boards, sets the chapter's canon text, then advances the chapter.
- **Manual override (moderator):** Open Submissions / Voting / Close (`setPhaseManual`), **Pause/Resume** automation (`setAuto` → `/api/phase/auto`), **Skip Phase** (`skipPhase` → `/api/phase/skip`), Advance Chapter, Auto-Select Canon, Reset. Manual actions reset the timer; automation resumes from the phase the admin set.
- **Countdown & indicators:** `voting_phase` now carries `remaining_ms`, `next_phase`, `auto`, `chapter_id`. Shown on MainMenu, Evidence, Theory List, and Admin (`phaseStatusLine()`).

**Edge cases handled:** server restart (state in Redis), chapter change (phase bound to `chapter` id; concurrency guard skips double-advance), late joins (phase computed on read), inactive admins (auto-advance continues), finale (no next chapter → `closed`, no dead-end).
**Known caveat:** lazy evaluation means a fully idle game advances on the *next* visit after the timer; the transition has a small non-transactional concurrency window (guarded by the chapter binding). Documented in README limitations.

## 2. One theory per chapter

`routes/theories.ts` + `redis.ts` (`CHAPTER_AUTHORS` hash).

- **Server authority:** submit checks `hasSubmittedForChapter()`; a second submit returns **409** "You have already submitted a theory for this chapter." Recorded via `recordChapterSubmission()`. Cleared on reset (`clearChapterAuthors`).
- **Client reflection:** `GET /api/theories` returns `user_submitted`; `EvidenceScene` shows **"✓ THEORY SUBMITTED"** (disabled) instead of the submit button, or **"🗳️ VOTE NOW"** / **"🔒 SUBMISSIONS CLOSED"** depending on phase.

## 3. Chapter clarity

Every theory shows a **`📖 CHAPTER N`** label in the Theory List and the Canon celebration; the phase banner shows the active chapter. Cross-chapter confusion is eliminated.

## 4. Notifications

`src/client/phase.ts::notifyPhaseChange()` compares the device's last-seen `(chapter, phase)` signature to the current one on every scene that loads phase (Menu, Evidence, Theory List) and toasts changes — e.g. "🗳️ Voting is now OPEN", "📖 New chapter released!". Silent on first sight.

## 5. Validated loops (code-traced)

Onboarding → chapter/evidence → **one** theory submit (+10 XP, phase-gated) → result "what's next" → theory list (chapter-labeled, phase countdown) → vote (+2 / author +5, caps, dedupe) → canon (auto at 12h **or** admin) → next chapter (auto/admin) → … → Ch.10 finale → closed. XP/ranks/badges/leaderboards/profile/notifications all wired.

**Status:** ✅ implemented, compiles, and lints clean.
