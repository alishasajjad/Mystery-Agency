import { Hono, type Context } from 'hono';
import { redis } from '@devvit/web/server';
import {
  getUser,
  getTheory,
  setTheory,
  addTheoryToChapter,
  getTheoriesByChapter,
  incrementTheoryVotes,
  addVoteToTheory,
  hasUserVotedForTheory,
  recordVoteCast,
  recordVoteReceived,
  resetDailyVotesIfNeeded,
  hasSubmittedForChapter,
  recordChapterSubmission,
  getCurrentChapter,
  getChapter,
  setUser,
  getTopTheoryForChapter,
} from '../services/redis';
import { addXP, updateStreak, checkAndAwardBadges, getMaxVotesForRank, calculateRank } from '../services/xp';
import { resolvePhase, canonizeTheory } from '../services/phase';
import { getUserId, isModerator } from '../services/auth';
import { XP_VALUES, THEORY_CONFIG, VOTING_PHASES } from '../../shared/constants';
import type { Theory, TheoryType } from '../../shared/types';

const theories = new Hono();

const VALID_THEORY_TYPES: readonly TheoryType[] = ['suspect', 'motive', 'method', 'prediction'];

function today(): string {
  return new Date().toISOString().split('T')[0] as string;
}

// Get theories for the current chapter
theories.get('/', async (c: Context) => {
  const userId = getUserId();
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const currentChapterId = await getCurrentChapter(redis);
  if (!currentChapterId) {
    return c.json({ error: 'No active chapter' }, 404);
  }

  const chapter = await getChapter(redis, currentChapterId);
  const theoryIds = await getTheoriesByChapter(redis, currentChapterId);
  const votingPhase = await resolvePhase(redis);
  const userSubmitted = await hasSubmittedForChapter(redis, currentChapterId, userId);

  const theoryList: Theory[] = [];
  for (const theoryId of theoryIds) {
    const theory = await getTheory(redis, theoryId);
    if (theory) theoryList.push(theory);
  }
  // Show the most upvoted theories first.
  theoryList.sort((a, b) => b.votes - a.votes);

  return c.json({ chapter, theories: theoryList, voting_phase: votingPhase, user_submitted: userSubmitted });
});

// Submit a new theory (one per chapter, per player)
theories.post('/', async (c: Context) => {
  const userId = getUserId();
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const body = await c.req.json().catch(() => ({}));
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const theoryType = body.theory_type as TheoryType;
  const evidenceTags: string[] = Array.isArray(body.evidence_tags) ? body.evidence_tags : [];

  if (!content || !theoryType) {
    return c.json({ error: 'Content and theory type are required' }, 400);
  }
  if (!VALID_THEORY_TYPES.includes(theoryType)) {
    return c.json({ error: 'Invalid theory type' }, 400);
  }
  if (content.length > THEORY_CONFIG.MAX_LENGTH) {
    return c.json({ error: `Theory must be ${THEORY_CONFIG.MAX_LENGTH} characters or fewer` }, 400);
  }
  if (evidenceTags.length < THEORY_CONFIG.MIN_EVIDENCE_TAGS) {
    return c.json({ error: 'Tag at least one piece of evidence' }, 400);
  }

  const votingPhase = await resolvePhase(redis);
  if (votingPhase.phase !== VOTING_PHASES.SUBMISSION) {
    return c.json({ error: 'Theory submission is closed' }, 400);
  }

  const currentChapterId = await getCurrentChapter(redis);
  if (!currentChapterId) {
    return c.json({ error: 'No active chapter' }, 404);
  }

  // Enforce ONE theory per chapter per player (server-side authority).
  if (await hasSubmittedForChapter(redis, currentChapterId, userId)) {
    return c.json({ error: 'You have already submitted a theory for this chapter' }, 409);
  }

  const chapter = await getChapter(redis, currentChapterId);
  if (!chapter) {
    return c.json({ error: 'No active chapter' }, 404);
  }

  // Evidence tags must reference real clues in the current chapter.
  const validClueIds = new Set(chapter.clues.map((clue) => clue.id));
  const cleanedTags = evidenceTags.filter((tag) => validClueIds.has(tag));
  if (cleanedTags.length < THEORY_CONFIG.MIN_EVIDENCE_TAGS) {
    return c.json({ error: 'Selected evidence is invalid' }, 400);
  }

  const user = await getUser(redis, userId);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const now = Date.now();
  const theoryId = `theory_${now}_${Math.random().toString(36).substring(2, 11)}`;
  const theory: Theory = {
    id: theoryId,
    author_id: userId,
    author_username: user.username,
    chapter_id: currentChapterId,
    content,
    theory_type: theoryType,
    evidence_tags: cleanedTags,
    votes: 0,
    is_canon: false,
    created_at: now,
  };

  await setTheory(redis, theoryId, theory);
  await addTheoryToChapter(redis, currentChapterId, theoryId, now);
  await recordChapterSubmission(redis, currentChapterId, userId, theoryId);

  user.theories_submitted += 1;
  await setUser(redis, userId, user);

  await addXP(redis, userId, XP_VALUES.THEORY_SUBMISSION);
  await updateStreak(redis, userId, true);
  await checkAndAwardBadges(redis, userId);

  return c.json({ theory, xp_gained: XP_VALUES.THEORY_SUBMISSION });
});

// Vote for a theory
theories.post('/:theoryId/vote', async (c: Context) => {
  const userId = getUserId();
  if (!userId) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const theoryId = c.req.param('theoryId');
  if (!theoryId) {
    return c.json({ error: 'Theory ID required' }, 400);
  }

  const votingPhase = await resolvePhase(redis);
  if (votingPhase.phase !== VOTING_PHASES.VOTING) {
    return c.json({ error: 'Voting is not open' }, 400);
  }

  const theory = await getTheory(redis, theoryId);
  if (!theory) {
    return c.json({ error: 'Theory not found' }, 404);
  }
  if (theory.is_canon) {
    return c.json({ error: 'This theory is already canon' }, 400);
  }
  if (theory.author_id === userId) {
    return c.json({ error: 'You cannot vote for your own theory' }, 400);
  }

  let user = await getUser(redis, userId);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  user = await resetDailyVotesIfNeeded(redis, user, userId, today());

  const maxVotes = getMaxVotesForRank(calculateRank(user.xp));
  if (user.votes_cast_today >= maxVotes) {
    return c.json({ error: 'Daily vote limit reached' }, 400);
  }

  if (await hasUserVotedForTheory(redis, theoryId, userId)) {
    return c.json({ error: 'You already voted for this theory' }, 400);
  }

  await addVoteToTheory(redis, theoryId, userId);
  await recordVoteCast(redis, userId, today());
  const newVotes = await incrementTheoryVotes(redis, theoryId);

  // Voter earns XP for participating; author earns XP for the vote received.
  await addXP(redis, userId, XP_VALUES.VOTE_CAST);
  await recordVoteReceived(redis, theory.author_id, XP_VALUES.VOTE_RECEIVED);
  await checkAndAwardBadges(redis, theory.author_id);

  return c.json({ theory: { ...theory, votes: newVotes }, xp_gained: XP_VALUES.VOTE_CAST });
});

// Select canon theory (moderator only)
theories.post('/:theoryId/canon', async (c: Context) => {
  if (!(await isModerator())) {
    return c.json({ error: 'Moderator access required' }, 403);
  }

  const theoryId = c.req.param('theoryId');
  if (!theoryId) {
    return c.json({ error: 'Theory ID required' }, 400);
  }

  const theory = await getTheory(redis, theoryId);
  if (!theory) {
    return c.json({ error: 'Theory not found' }, 404);
  }

  await canonizeTheory(redis, theory);
  return c.json({ theory: { ...theory, is_canon: true }, message: 'Theory set as canon' });
});

// Auto-select canon theory (moderator only — highest voted theory wins)
theories.post('/auto-canon', async (c: Context) => {
  if (!(await isModerator())) {
    return c.json({ error: 'Moderator access required' }, 403);
  }

  const currentChapterId = await getCurrentChapter(redis);
  if (!currentChapterId) {
    return c.json({ error: 'No active chapter' }, 404);
  }

  const topTheory = await getTopTheoryForChapter(redis, currentChapterId);
  if (!topTheory) {
    return c.json({ error: 'No theories found for this chapter' }, 404);
  }

  await canonizeTheory(redis, topTheory);
  return c.json({ theory: { ...topTheory, is_canon: true }, message: 'Top theory set as canon' });
});

export { theories };
