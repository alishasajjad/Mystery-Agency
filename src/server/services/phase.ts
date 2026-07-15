import type { RedisClient } from '@devvit/web/server';
import {
  readPhase,
  writePhase,
  type RawPhase,
  getTopTheoryForChapter,
  setCanonTheory,
  recordCanonForAuthor,
  getUser,
  setUser,
  getChapter,
  setChapter,
  getCurrentChapter,
  setCurrentChapter,
} from './redis';
import { addXP, checkAndAwardBadges } from './xp';
import { CHAPTER_IDS } from './story-init';
import { XP_VALUES, THEORY_CONFIG } from '../../shared/constants';
import type { Theory, VotingPhase, VotingPhaseName } from '../../shared/types';

const SUBMISSION_MS = THEORY_CONFIG.SUBMISSION_WINDOW_HOURS * 3600 * 1000;
const VOTING_MS = THEORY_CONFIG.VOTING_WINDOW_HOURS * 3600 * 1000;

function windowFor(phase: VotingPhaseName): number {
  return phase === 'voting' ? VOTING_MS : SUBMISSION_MS;
}

function toVotingPhase(raw: RawPhase, now: number): VotingPhase {
  const remaining = raw.auto && raw.endsAt > 0 && raw.phase !== 'closed' ? Math.max(0, raw.endsAt - now) : 0;
  const next: VotingPhaseName = raw.phase === 'submission' ? 'voting' : 'submission';
  return {
    active: raw.phase !== 'closed',
    phase: raw.phase,
    ends_at: raw.endsAt,
    started_at: raw.startedAt,
    auto: raw.auto,
    remaining_ms: remaining,
    next_phase: next,
    chapter_id: raw.chapterId,
  };
}

/**
 * Shared canonization side effects: mark canon, reward author, update chapter + boards.
 * Used by both the admin canon routes and automatic voting-end resolution.
 */
export async function canonizeTheory(redis: RedisClient, theory: Theory): Promise<void> {
  await setCanonTheory(redis, theory.id);
  await addXP(redis, theory.author_id, XP_VALUES.THEORY_CANONIZED);
  await recordCanonForAuthor(redis, theory.author_id);

  const author = await getUser(redis, theory.author_id);
  if (author) {
    author.theories_canonized += 1;
    await setUser(redis, theory.author_id, author);
  }
  await checkAndAwardBadges(redis, theory.author_id);

  const chapter = await getChapter(redis, theory.chapter_id);
  if (chapter) {
    chapter.canon_theory = theory.content;
    await setChapter(redis, theory.chapter_id, chapter);
  }
}

/** Advance voting → canon-reveal → next chapter (or close on the finale). */
async function advanceFromVoting(redis: RedisClient, raw: RawPhase, now: number): Promise<RawPhase> {
  const current = await getCurrentChapter(redis);

  // Concurrency guard: only the phase bound to the still-current chapter advances.
  if (raw.chapterId && current && raw.chapterId !== current) {
    return readPhase(redis);
  }

  const chapterForCanon = current ?? raw.chapterId;
  if (chapterForCanon) {
    const top = await getTopTheoryForChapter(redis, chapterForCanon);
    if (top) await canonizeTheory(redis, top);
  }

  const idx = current ? CHAPTER_IDS.indexOf(current) : -1;
  if (idx >= 0 && idx < CHAPTER_IDS.length - 1) {
    const next = CHAPTER_IDS[idx + 1]!;
    await setCurrentChapter(redis, next);
    const r: RawPhase = { phase: 'submission', endsAt: now + SUBMISSION_MS, startedAt: now, auto: raw.auto, chapterId: next };
    await writePhase(redis, r);
    return r;
  }

  // Finale reached — canon set, campaign complete.
  const closed: RawPhase = { phase: 'closed', endsAt: 0, startedAt: now, auto: raw.auto, chapterId: current ?? raw.chapterId };
  await writePhase(redis, closed);
  return closed;
}

/** Perform exactly one phase transition. */
async function advance(redis: RedisClient, raw: RawPhase, now: number): Promise<RawPhase> {
  if (raw.phase === 'submission') {
    const current = await getCurrentChapter(redis);
    const r: RawPhase = { phase: 'voting', endsAt: now + VOTING_MS, startedAt: now, auto: raw.auto, chapterId: current };
    await writePhase(redis, r);
    return r;
  }
  if (raw.phase === 'voting') {
    return advanceFromVoting(redis, raw, now);
  }
  // closed → reopen submissions for the current chapter
  const current = await getCurrentChapter(redis);
  const r: RawPhase = { phase: 'submission', endsAt: now + SUBMISSION_MS, startedAt: now, auto: raw.auto, chapterId: current };
  await writePhase(redis, r);
  return r;
}

/**
 * The canonical phase getter. Reads stored state and, if automatic progression is
 * enabled and the timer has elapsed, advances the phase (lazy cron) before returning.
 * Called on every read path, so players and admins always see an up-to-date phase.
 */
export async function resolvePhase(redis: RedisClient): Promise<VotingPhase> {
  const now = Date.now();
  let raw = await readPhase(redis);
  if (raw.auto && raw.endsAt > 0 && now >= raw.endsAt && raw.phase !== 'closed') {
    raw = await advance(redis, raw, now);
  }
  return toVotingPhase(raw, now);
}

// --- Admin controls ---------------------------------------------------------

/** Manually set a phase (admin override). Resets the timer; keeps the auto setting. */
export async function setPhaseManual(redis: RedisClient, phase: VotingPhaseName): Promise<VotingPhase> {
  const now = Date.now();
  const prev = await readPhase(redis);
  const current = await getCurrentChapter(redis);
  const r: RawPhase = {
    phase,
    endsAt: phase === 'closed' ? 0 : now + windowFor(phase),
    startedAt: now,
    auto: prev.auto,
    chapterId: current,
  };
  await writePhase(redis, r);
  return toVotingPhase(r, now);
}

/** Pause (auto=false) or resume (auto=true) automatic progression. */
export async function setAuto(redis: RedisClient, auto: boolean): Promise<VotingPhase> {
  const now = Date.now();
  const raw = await readPhase(redis);
  // On resume, restart the timer so a long pause doesn't fire an instant advance.
  const endsAt = auto && raw.phase !== 'closed' ? now + windowFor(raw.phase) : raw.endsAt;
  const updated: RawPhase = { ...raw, auto, endsAt, startedAt: auto ? now : raw.startedAt };
  await writePhase(redis, updated);
  return toVotingPhase(updated, now);
}

/** Trigger the next transition immediately, regardless of the timer. */
export async function skipPhase(redis: RedisClient): Promise<VotingPhase> {
  const now = Date.now();
  const raw = await readPhase(redis);
  const advanced = await advance(redis, raw, now);
  return toVotingPhase(advanced, now);
}

/** Initial phase state for install / reset: submission, auto on, timer running. */
export async function seedPhase(redis: RedisClient, chapterId: string): Promise<void> {
  const now = Date.now();
  await writePhase(redis, { phase: 'submission', endsAt: now + SUBMISSION_MS, startedAt: now, auto: true, chapterId });
}
