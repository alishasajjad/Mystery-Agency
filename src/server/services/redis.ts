import type { RedisClient } from '@devvit/web/server';
import { REDIS_KEYS } from '../../shared/constants';
import type { Chapter, Theory, User, VotingPhaseName } from '../../shared/types';

// NOTE: The Devvit `RedisClient` (v0.13.x) supports strings, hashes and sorted sets
// only — there are no set commands (sAdd/sMembers/sIsMember). Membership collections
// (theories-per-chapter, votes-per-theory, canon) are therefore modelled as sorted
// sets scored by timestamp, which also gives us stable ordering for free.

// ---------------------------------------------------------------------------
// User Operations
// ---------------------------------------------------------------------------
export async function getUser(redis: RedisClient, userId: string): Promise<User | null> {
  try {
    const userData = await redis.hGetAll(REDIS_KEYS.USER(userId));

    if (!userData || Object.keys(userData).length === 0) {
      return null;
    }

    return {
      username: userData.username || '',
      xp: parseInt(userData.xp || '0'),
      rank: userData.rank || 'Rookie',
      theories_submitted: parseInt(userData.theories_submitted || '0'),
      theories_canonized: parseInt(userData.theories_canonized || '0'),
      votes_cast_today: parseInt(userData.votes_cast_today || '0'),
      last_vote_date: userData.last_vote_date || '',
      submission_streak: parseInt(userData.submission_streak || '0'),
      badges: userData.badges ? (JSON.parse(userData.badges) as string[]) : [],
      last_login_date: userData.last_login_date || '',
      votes_reset_date: userData.votes_reset_date || '',
    };
  } catch (error) {
    console.error('Error in getUser:', error);
    return null;
  }
}

export async function setUser(redis: RedisClient, userId: string, user: User): Promise<void> {
  try {
    await redis.hSet(REDIS_KEYS.USER(userId), {
      username: user.username,
      xp: user.xp.toString(),
      rank: user.rank,
      theories_submitted: user.theories_submitted.toString(),
      theories_canonized: user.theories_canonized.toString(),
      votes_cast_today: user.votes_cast_today.toString(),
      last_vote_date: user.last_vote_date,
      submission_streak: user.submission_streak.toString(),
      badges: JSON.stringify(user.badges),
      last_login_date: user.last_login_date,
      votes_reset_date: user.votes_reset_date,
    });
  } catch (error) {
    console.error('Error in setUser:', error);
    throw error;
  }
}

export async function createUser(redis: RedisClient, userId: string, username: string): Promise<User> {
  const user: User = {
    username,
    xp: 0,
    rank: 'Rookie',
    theories_submitted: 0,
    theories_canonized: 0,
    votes_cast_today: 0,
    last_vote_date: '',
    submission_streak: 0,
    badges: [],
    last_login_date: '',
    votes_reset_date: '',
  };

  await setUser(redis, userId, user);
  // Seed the XP leaderboard so new detectives appear immediately.
  await redis.zAdd(REDIS_KEYS.LEADERBOARD_XP, { score: 0, member: userId });
  return user;
}

export async function incrementUserXP(redis: RedisClient, userId: string, amount: number): Promise<number> {
  const userKey = REDIS_KEYS.USER(userId);
  const newXP = await redis.hIncrBy(userKey, 'xp', amount);
  // zIncrBy signature is (key, member, value) — the leaderboard is keyed by userId.
  await redis.zIncrBy(REDIS_KEYS.LEADERBOARD_XP, userId, amount);
  return newXP;
}

/**
 * Award XP received for a theory getting an upvote: bumps the author's total XP
 * and the "votes received" leaderboard. Returns the new votes-received score.
 */
export async function recordVoteReceived(
  redis: RedisClient,
  authorId: string,
  xpAmount: number
): Promise<number> {
  await incrementUserXP(redis, authorId, xpAmount);
  return redis.zIncrBy(REDIS_KEYS.LEADERBOARD_VOTES_RECEIVED, authorId, 1);
}

/** Increment the per-user daily vote counter and stamp today's date. */
export async function recordVoteCast(redis: RedisClient, userId: string, today: string): Promise<void> {
  const userKey = REDIS_KEYS.USER(userId);
  await redis.hIncrBy(userKey, 'votes_cast_today', 1);
  await redis.hSet(userKey, { votes_reset_date: today });
}

/** Reset the daily vote counter when a new day has started. */
export async function resetDailyVotesIfNeeded(redis: RedisClient, user: User, userId: string, today: string): Promise<User> {
  if (user.votes_reset_date !== today) {
    user.votes_cast_today = 0;
    user.votes_reset_date = today;
    await redis.hSet(REDIS_KEYS.USER(userId), {
      votes_cast_today: '0',
      votes_reset_date: today,
    });
  }
  return user;
}

// ---------------------------------------------------------------------------
// Chapter Operations
// ---------------------------------------------------------------------------
export async function getChapter(redis: RedisClient, chapterId: string): Promise<Chapter | null> {
  try {
    const chapterData = await redis.hGetAll(REDIS_KEYS.CHAPTER(chapterId));

    if (!chapterData || Object.keys(chapterData).length === 0) {
      return null;
    }

    let parsedClues: Chapter['clues'] = [];
    try {
      parsedClues = chapterData.clues ? (JSON.parse(chapterData.clues) as Chapter['clues']) : [];
    } catch (parseError) {
      console.error('Failed to parse clues JSON:', parseError);
    }

    return {
      id: chapterId,
      title: chapterData.title || '',
      content: chapterData.content || '',
      clues: parsedClues,
      canon_theory: chapterData.canon_theory || null,
      theory_type: (chapterData.theory_type as Chapter['theory_type']) || 'suspect',
      created_at: parseInt(chapterData.created_at || '0'),
    };
  } catch (error) {
    console.error('Error in getChapter:', error);
    return null;
  }
}

export async function setChapter(redis: RedisClient, chapterId: string, chapter: Chapter): Promise<void> {
  try {
    await redis.hSet(REDIS_KEYS.CHAPTER(chapterId), {
      title: chapter.title,
      content: chapter.content,
      clues: JSON.stringify(chapter.clues),
      canon_theory: chapter.canon_theory || '',
      theory_type: chapter.theory_type,
      created_at: chapter.created_at.toString(),
    });
  } catch (error) {
    console.error('Error in setChapter:', error);
    throw error;
  }
}

export async function getCurrentChapter(redis: RedisClient): Promise<string | null> {
  try {
    const result = await redis.get(REDIS_KEYS.STORY_CURRENT_CHAPTER);
    return result ?? null;
  } catch (error) {
    console.error('Error in getCurrentChapter:', error);
    return null;
  }
}

export async function setCurrentChapter(redis: RedisClient, chapterId: string): Promise<void> {
  try {
    await redis.set(REDIS_KEYS.STORY_CURRENT_CHAPTER, chapterId);
  } catch (error) {
    console.error('Error in setCurrentChapter:', error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Theory Operations
// ---------------------------------------------------------------------------
export async function getTheory(redis: RedisClient, theoryId: string): Promise<Theory | null> {
  try {
    const theoryData = await redis.hGetAll(REDIS_KEYS.THEORY(theoryId));

    if (!theoryData || Object.keys(theoryData).length === 0) {
      return null;
    }

    return {
      id: theoryId,
      author_id: theoryData.author_id || '',
      author_username: theoryData.author_username || '',
      chapter_id: theoryData.chapter_id || '',
      content: theoryData.content || '',
      theory_type: (theoryData.theory_type as Theory['theory_type']) || 'suspect',
      evidence_tags: theoryData.evidence_tags ? (JSON.parse(theoryData.evidence_tags) as string[]) : [],
      votes: parseInt(theoryData.votes || '0'),
      is_canon: theoryData.is_canon === 'true',
      created_at: parseInt(theoryData.created_at || '0'),
    };
  } catch (error) {
    console.error('Error in getTheory:', error);
    return null;
  }
}

export async function setTheory(redis: RedisClient, theoryId: string, theory: Theory): Promise<void> {
  try {
    await redis.hSet(REDIS_KEYS.THEORY(theoryId), {
      author_id: theory.author_id,
      author_username: theory.author_username,
      chapter_id: theory.chapter_id,
      content: theory.content,
      theory_type: theory.theory_type,
      evidence_tags: JSON.stringify(theory.evidence_tags),
      votes: theory.votes.toString(),
      is_canon: theory.is_canon ? 'true' : 'false',
      created_at: theory.created_at.toString(),
    });
  } catch (error) {
    console.error('Error in setTheory:', error);
    throw error;
  }
}

export async function addTheoryToChapter(redis: RedisClient, chapterId: string, theoryId: string, createdAt: number): Promise<void> {
  try {
    await redis.zAdd(REDIS_KEYS.THEORIES_BY_CHAPTER(chapterId), { member: theoryId, score: createdAt });
  } catch (error) {
    console.error('Error in addTheoryToChapter:', error);
    throw error;
  }
}

export async function getTheoriesByChapter(redis: RedisClient, chapterId: string): Promise<string[]> {
  try {
    const members = await redis.zRange(REDIS_KEYS.THEORIES_BY_CHAPTER(chapterId), 0, -1, { by: 'rank' });
    return members.map((m) => m.member);
  } catch (error) {
    console.error('Error in getTheoriesByChapter:', error);
    return [];
  }
}

export async function incrementTheoryVotes(redis: RedisClient, theoryId: string): Promise<number> {
  try {
    const newVotes = await redis.hIncrBy(REDIS_KEYS.THEORY(theoryId), 'votes', 1);
    await redis.zIncrBy(REDIS_KEYS.THEORIES_TRENDING, theoryId, 1);
    return newVotes;
  } catch (error) {
    console.error('Error in incrementTheoryVotes:', error);
    throw error;
  }
}

export async function setCanonTheory(redis: RedisClient, theoryId: string): Promise<void> {
  try {
    await redis.hSet(REDIS_KEYS.THEORY(theoryId), { is_canon: 'true' });
    await redis.zAdd(REDIS_KEYS.THEORIES_CANON, { member: theoryId, score: Date.now() });
  } catch (error) {
    console.error('Error in setCanonTheory:', error);
    throw error;
  }
}

/** Bump a user's canon_rate leaderboard score by one canonized theory. */
export async function recordCanonForAuthor(redis: RedisClient, authorId: string): Promise<void> {
  try {
    await redis.zIncrBy(REDIS_KEYS.LEADERBOARD_CANON_RATE, authorId, 1);
  } catch (error) {
    console.error('Error in recordCanonForAuthor:', error);
  }
}

export async function getTopTheoryForChapter(redis: RedisClient, chapterId: string): Promise<Theory | null> {
  const theoryIds = await getTheoriesByChapter(redis, chapterId);
  if (theoryIds.length === 0) return null;

  let topTheory: Theory | null = null;
  let maxVotes = -1;

  for (const theoryId of theoryIds) {
    const theory = await getTheory(redis, theoryId);
    if (theory && theory.votes > maxVotes && !theory.is_canon) {
      maxVotes = theory.votes;
      topTheory = theory;
    }
  }
  return topTheory;
}

// ---------------------------------------------------------------------------
// Voting Operations (raw persistence — resolvePhase() in phase.ts adds the timer logic)
// ---------------------------------------------------------------------------
export type RawPhase = {
  phase: VotingPhaseName;
  endsAt: number;
  startedAt: number;
  auto: boolean;
  chapterId: string | null;
};

export async function readPhase(redis: RedisClient): Promise<RawPhase> {
  try {
    const phase = await redis.get(REDIS_KEYS.VOTING_PHASE);
    const endsAt = await redis.get(REDIS_KEYS.VOTING_ENDS_AT);
    const startedAt = await redis.get(REDIS_KEYS.VOTING_STARTED_AT);
    const auto = await redis.get(REDIS_KEYS.VOTING_AUTO);
    const chapterId = await redis.get(REDIS_KEYS.VOTING_CHAPTER);
    return {
      phase: (phase as VotingPhaseName) || 'submission',
      endsAt: endsAt ? parseInt(endsAt) : 0,
      startedAt: startedAt ? parseInt(startedAt) : 0,
      auto: auto !== 'false', // default ON
      chapterId: chapterId || null,
    };
  } catch (error) {
    console.error('Error in readPhase:', error);
    return { phase: 'closed', endsAt: 0, startedAt: 0, auto: false, chapterId: null };
  }
}

export async function writePhase(redis: RedisClient, raw: RawPhase): Promise<void> {
  try {
    await redis.set(REDIS_KEYS.VOTING_ACTIVE, raw.phase !== 'closed' ? 'true' : 'false');
    await redis.set(REDIS_KEYS.VOTING_PHASE, raw.phase);
    await redis.set(REDIS_KEYS.VOTING_ENDS_AT, raw.endsAt.toString());
    await redis.set(REDIS_KEYS.VOTING_STARTED_AT, raw.startedAt.toString());
    await redis.set(REDIS_KEYS.VOTING_AUTO, raw.auto ? 'true' : 'false');
    await redis.set(REDIS_KEYS.VOTING_CHAPTER, raw.chapterId ?? '');
  } catch (error) {
    console.error('Error in writePhase:', error);
    throw error;
  }
}

// --- One theory per chapter -------------------------------------------------
export async function hasSubmittedForChapter(redis: RedisClient, chapterId: string, userId: string): Promise<boolean> {
  try {
    const existing = await redis.hGet(REDIS_KEYS.CHAPTER_AUTHORS(chapterId), userId);
    return existing !== undefined && existing !== '';
  } catch (error) {
    console.error('Error in hasSubmittedForChapter:', error);
    return false;
  }
}

export async function recordChapterSubmission(redis: RedisClient, chapterId: string, userId: string, theoryId: string): Promise<void> {
  await redis.hSet(REDIS_KEYS.CHAPTER_AUTHORS(chapterId), { [userId]: theoryId });
}

export async function clearChapterAuthors(redis: RedisClient, chapterId: string): Promise<void> {
  try {
    const authors = await redis.hGetAll(REDIS_KEYS.CHAPTER_AUTHORS(chapterId));
    const ids = Object.keys(authors);
    if (ids.length > 0) await redis.hDel(REDIS_KEYS.CHAPTER_AUTHORS(chapterId), ids);
  } catch (error) {
    console.error('Error in clearChapterAuthors:', error);
  }
}

export async function addVoteToTheory(redis: RedisClient, theoryId: string, userId: string): Promise<void> {
  try {
    await redis.zAdd(REDIS_KEYS.VOTES_BY_THEORY(theoryId), { member: userId, score: Date.now() });
  } catch (error) {
    console.error('Error in addVoteToTheory:', error);
    throw error;
  }
}

export async function hasUserVotedForTheory(redis: RedisClient, theoryId: string, userId: string): Promise<boolean> {
  try {
    const score = await redis.zScore(REDIS_KEYS.VOTES_BY_THEORY(theoryId), userId);
    return score !== undefined;
  } catch (error) {
    console.error('Error in hasUserVotedForTheory:', error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Leaderboard Operations
// ---------------------------------------------------------------------------
export async function getLeaderboard(
  redis: RedisClient,
  type: 'xp' | 'canon_rate' | 'votes_received',
  limit = 10
) {
  let key: string;
  switch (type) {
    case 'canon_rate':
      key = REDIS_KEYS.LEADERBOARD_CANON_RATE;
      break;
    case 'votes_received':
      key = REDIS_KEYS.LEADERBOARD_VOTES_RECEIVED;
      break;
    case 'xp':
    default:
      key = REDIS_KEYS.LEADERBOARD_XP;
      break;
  }

  try {
    // zRange with reverse gives highest-scored members first (Devvit has no zRevRange).
    const entries = await redis.zRange(key, 0, limit - 1, { reverse: true, by: 'rank' });

    const result = [];
    for (const entry of entries) {
      const user = await getUser(redis, entry.member);
      if (user) {
        result.push({
          username: user.username,
          xp: user.xp,
          rank: user.rank,
          theories_canonized: user.theories_canonized,
          total_votes: user.theories_submitted, // theories authored, shown as a stat column
          score: entry.score,
        });
      }
    }
    return result;
  } catch (error) {
    console.error('Error in getLeaderboard:', error);
    return [];
  }
}
