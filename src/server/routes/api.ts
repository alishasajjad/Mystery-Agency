import { Hono } from 'hono';
import { redis, reddit, context } from '@devvit/web/server';
import { theories } from './theories';
import { getUser, createUser, getCurrentChapter, getChapter, getLeaderboard, setCurrentChapter } from '../services/redis';
import { claimDailyLogin } from '../services/xp';
import { resolvePhase, setPhaseManual, setAuto, skipPhase } from '../services/phase';
import { getUserId, isModerator } from '../services/auth';
import { initializeStory, resetStory, CHAPTER_IDS } from '../services/story-init';
import { VOTING_PHASES, type VotingPhaseType } from '../../shared/constants';
import type { LeaderboardType, VotingPhaseName } from '../../shared/types';

type ErrorResponse = { status: 'error'; message: string };

export const api = new Hono();

function today(): string {
  return new Date().toISOString().split('T')[0] as string;
}

async function requireMod(): Promise<ErrorResponse | null> {
  return (await isModerator()) ? null : { status: 'error', message: 'Moderator access required' };
}

// User Profile
api.get('/profile', async (c) => {
  const userId = getUserId();
  if (!userId) {
    return c.json<ErrorResponse>({ status: 'error', message: 'Authentication required' }, 401);
  }

  try {
    const username = (await reddit.getCurrentUsername()) ?? 'anonymous';
    let user = await getUser(redis, userId);
    if (!user) {
      user = await createUser(redis, userId, username);
    }

    // Award the daily-login bonus at most once per day, then return fresh data.
    await claimDailyLogin(redis, userId, today());
    const fresh = (await getUser(redis, userId)) ?? user;
    return c.json({ user: fresh });
  } catch (error) {
    console.error('Profile Error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed to fetch profile' }, 500);
  }
});

// Daily login bonus (idempotent per day)
api.post('/daily-login', async (c) => {
  const userId = getUserId();
  if (!userId) {
    return c.json<ErrorResponse>({ status: 'error', message: 'Authentication required' }, 401);
  }

  try {
    const xpGained = await claimDailyLogin(redis, userId, today());
    return c.json({ xp_gained: xpGained, already_claimed: xpGained === 0 });
  } catch (error) {
    console.error('Daily Login Error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed to award daily bonus' }, 500);
  }
});

// Current Chapter (self-heals if the story was never initialized)
api.get('/chapter', async (c) => {
  try {
    let currentChapterId = await getCurrentChapter(redis);
    if (!currentChapterId) {
      await initializeStory(redis);
      currentChapterId = await getCurrentChapter(redis);
    }
    if (!currentChapterId) {
      return c.json<ErrorResponse>({ status: 'error', message: 'No active chapter' }, 404);
    }

    const chapter = await getChapter(redis, currentChapterId);
    return c.json({ chapter });
  } catch (error) {
    console.error('Chapter Error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed to fetch chapter' }, 500);
  }
});

// Leaderboard
api.get('/leaderboard', async (c) => {
  const requested = c.req.query('type');
  const type: LeaderboardType =
    requested === 'canon_rate' || requested === 'votes_received' ? requested : 'xp';

  try {
    const leaderboard = await getLeaderboard(redis, type, 10);
    return c.json({ leaderboard, type });
  } catch (error) {
    console.error('Leaderboard Error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed to fetch leaderboard' }, 500);
  }
});

// Admin access + live game state — lets the client reveal admin UI only for real
// moderators, and gives the Admin panel the current phase/chapter to display.
api.get('/admin/status', async (c) => {
  const userId = getUserId();
  let username: string | null = null;
  try {
    username = (await reddit.getCurrentUsername()) ?? null;
  } catch (error) {
    console.error('admin/status username lookup failed:', error);
  }
  const moderator = await isModerator();
  const votingPhase = await resolvePhase(redis);
  const chapterId = await getCurrentChapter(redis);

  return c.json({
    userId,
    username,
    subreddit: context.subredditName ?? null,
    isModerator: moderator,
    adminAccess: moderator,
    phase: votingPhase.phase,
    chapterId,
    voting_phase: votingPhase,
    chapterCount: CHAPTER_IDS.length,
  });
});

// --- Moderator-only controls ---------------------------------------------

api.post('/voting-phase', async (c) => {
  const denied = await requireMod();
  if (denied) return c.json<ErrorResponse>(denied, 403);

  const body = await c.req.json().catch(() => ({}));
  const phase = body.phase as VotingPhaseType | undefined;
  const validPhases: VotingPhaseName[] = [VOTING_PHASES.SUBMISSION, VOTING_PHASES.VOTING, VOTING_PHASES.CLOSED];
  if (!phase || !validPhases.includes(phase)) {
    return c.json<ErrorResponse>({ status: 'error', message: 'Invalid phase' }, 400);
  }

  try {
    const voting_phase = await setPhaseManual(redis, phase);
    return c.json({ message: 'Voting phase updated', phase, voting_phase });
  } catch (error) {
    console.error('Voting Phase Error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed to update voting phase' }, 500);
  }
});

// Toggle automatic 12-hour progression (pause = auto:false, resume = auto:true).
api.post('/phase/auto', async (c) => {
  const denied = await requireMod();
  if (denied) return c.json<ErrorResponse>(denied, 403);

  const body = await c.req.json().catch(() => ({}));
  const auto = body.auto === true;
  try {
    const voting_phase = await setAuto(redis, auto);
    return c.json({ message: auto ? 'Automatic progression resumed' : 'Automatic progression paused', voting_phase });
  } catch (error) {
    console.error('Phase Auto Error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed to update progression' }, 500);
  }
});

// Immediately trigger the next phase transition (canonizes + advances if voting ends).
api.post('/phase/skip', async (c) => {
  const denied = await requireMod();
  if (denied) return c.json<ErrorResponse>(denied, 403);

  try {
    const voting_phase = await skipPhase(redis);
    return c.json({ message: 'Advanced to the next phase', voting_phase });
  } catch (error) {
    console.error('Phase Skip Error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed to skip phase' }, 500);
  }
});

api.post('/chapter/advance', async (c) => {
  const denied = await requireMod();
  if (denied) return c.json<ErrorResponse>(denied, 403);

  try {
    const currentChapterId = await getCurrentChapter(redis);
    if (!currentChapterId) {
      return c.json<ErrorResponse>({ status: 'error', message: 'No active chapter' }, 404);
    }

    const idx = CHAPTER_IDS.indexOf(currentChapterId);
    if (idx === -1 || idx >= CHAPTER_IDS.length - 1) {
      return c.json<ErrorResponse>({ status: 'error', message: 'No further chapters available' }, 400);
    }

    const nextChapterId = CHAPTER_IDS[idx + 1]!;
    await setCurrentChapter(redis, nextChapterId);
    // Fresh chapter opens for submissions again (timer + auto schedule reset).
    await setPhaseManual(redis, VOTING_PHASES.SUBMISSION);
    return c.json({ message: 'Chapter advanced', nextChapterId });
  } catch (error) {
    console.error('Advance Chapter Error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed to advance chapter' }, 500);
  }
});

api.post('/set-chapter', async (c) => {
  const denied = await requireMod();
  if (denied) return c.json<ErrorResponse>(denied, 403);

  const body = await c.req.json().catch(() => ({}));
  const chapterId = body.chapterId as string | undefined;
  if (!chapterId || !CHAPTER_IDS.includes(chapterId)) {
    return c.json<ErrorResponse>({ status: 'error', message: 'Unknown chapter' }, 400);
  }

  try {
    await setCurrentChapter(redis, chapterId);
    return c.json({ message: 'Current chapter updated', chapterId });
  } catch (error) {
    console.error('Set Chapter Error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed to set chapter' }, 500);
  }
});

api.post('/admin/reset', async (c) => {
  const denied = await requireMod();
  if (denied) return c.json<ErrorResponse>(denied, 403);

  try {
    await resetStory(redis);
    return c.json({ message: 'Game reset successfully' });
  } catch (error) {
    console.error('Reset Game Error:', error);
    return c.json<ErrorResponse>({ status: 'error', message: 'Failed to reset game' }, 500);
  }
});

// Mount theories routes
api.route('/theories', theories);
