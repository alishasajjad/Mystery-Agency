import type { RedisClient } from '@devvit/web/server';
import { RANKS, XP_VALUES, BADGES, REDIS_KEYS, type RankName } from '../../shared/constants';
import { getUser, setUser, incrementUserXP } from './redis';

export function calculateRank(xp: number): RankName {
  if (xp >= RANKS.AGENCY_DIRECTOR.min_xp) return 'AGENCY_DIRECTOR';
  if (xp >= RANKS.LEAD_DETECTIVE.min_xp) return 'LEAD_DETECTIVE';
  if (xp >= RANKS.SENIOR_DETECTIVE.min_xp) return 'SENIOR_DETECTIVE';
  if (xp >= RANKS.DETECTIVE.min_xp) return 'DETECTIVE';
  if (xp >= RANKS.INVESTIGATOR.min_xp) return 'INVESTIGATOR';
  return 'ROOKIE';
}

export function getRankConfig(rank: RankName) {
  return RANKS[rank];
}

export function getMaxVotesForRank(rank: RankName): number {
  return RANKS[rank].max_votes;
}

export function getMaxTheoriesForRank(rank: RankName): number {
  return RANKS[rank].max_theories;
}

export async function addXP(redis: RedisClient, userId: string, amount: number) {
  const newXP = await incrementUserXP(redis, userId, amount);
  const user = await getUser(redis, userId);
  if (!user) return null;

  const oldRank = user.rank;
  const newRank = RANKS[calculateRank(newXP)].name;

  if (oldRank !== newRank) {
    user.rank = newRank;
    await setUser(redis, userId, user);
  }

  return { newXP, oldRank, newRank, rankUp: oldRank !== newRank };
}

/**
 * Award the daily-login bonus at most once per calendar day. Returns the XP
 * granted (0 if already claimed today).
 */
export async function claimDailyLogin(redis: RedisClient, userId: string, today: string): Promise<number> {
  const user = await getUser(redis, userId);
  if (!user) return 0;
  if (user.last_login_date === today) return 0;

  user.last_login_date = today;
  await setUser(redis, userId, user);
  await addXP(redis, userId, XP_VALUES.DAILY_LOGIN);
  return XP_VALUES.DAILY_LOGIN;
}

export async function checkAndAwardBadges(redis: RedisClient, userId: string): Promise<string[]> {
  const user = await getUser(redis, userId);
  if (!user) return [];

  const newBadges: string[] = [];
  const currentBadges = new Set(user.badges);

  // Real votes received, straight from the leaderboard (no more fake proxy).
  const votesReceived = (await redis.zScore(REDIS_KEYS.LEADERBOARD_VOTES_RECEIVED, userId)) ?? 0;

  const award = (badge: string, earned: boolean) => {
    if (earned && !currentBadges.has(badge)) {
      newBadges.push(badge);
      currentBadges.add(badge);
    }
  };

  award(BADGES.FIRST_CANON, user.theories_canonized >= 1);
  award(BADGES.TRENDSETTER, votesReceived >= 50);
  award(BADGES.CONSISTENT, user.submission_streak >= 30);
  award(BADGES.INFLUENCER, votesReceived >= 500);
  award(BADGES.STORY_WEAVER, user.theories_canonized >= 10);

  if (newBadges.length > 0) {
    user.badges = Array.from(currentBadges);
    await setUser(redis, userId, user);
  }

  return newBadges;
}

export async function updateStreak(redis: RedisClient, userId: string, submittedToday: boolean): Promise<number | null> {
  const user = await getUser(redis, userId);
  if (!user) return null;

  const today = new Date().toISOString().split('T')[0] as string;

  if (user.last_vote_date === today) {
    // Already counted for today.
    return user.submission_streak;
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0] as string;

  if (user.last_vote_date === yesterday && submittedToday) {
    user.submission_streak += 1;
    if (user.submission_streak === 7) {
      await addXP(redis, userId, XP_VALUES.STREAK_7_DAY);
    } else if (user.submission_streak === 30) {
      await addXP(redis, userId, XP_VALUES.STREAK_30_DAY);
    }
  } else if (user.last_vote_date !== today) {
    user.submission_streak = submittedToday ? 1 : 0;
  }

  if (submittedToday) {
    user.last_vote_date = today;
  }

  await setUser(redis, userId, user);
  return user.submission_streak;
}
