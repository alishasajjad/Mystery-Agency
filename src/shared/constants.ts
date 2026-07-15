// Rank Configuration
export const RANKS = {
  ROOKIE: { name: 'Rookie', min_xp: 0, max_votes: 5, max_theories: 1 },
  INVESTIGATOR: { name: 'Investigator', min_xp: 101, max_votes: 8, max_theories: 2 },
  DETECTIVE: { name: 'Detective', min_xp: 501, max_votes: 12, max_theories: 3 },
  SENIOR_DETECTIVE: { name: 'Senior Detective', min_xp: 2001, max_votes: 15, max_theories: 5 },
  LEAD_DETECTIVE: { name: 'Lead Detective', min_xp: 5001, max_votes: 20, max_theories: -1 },
  AGENCY_DIRECTOR: { name: 'Agency Director', min_xp: 10000, max_votes: 20, max_theories: -1 },
} as const;

export type RankName = keyof typeof RANKS;

// XP Values
export const XP_VALUES = {
  DAILY_LOGIN: 5,
  THEORY_SUBMISSION: 10,
  THEORY_CANONIZED: 100,
  VOTE_RECEIVED: 5,
  VOTE_CAST: 2,
  STREAK_7_DAY: 50,
  STREAK_30_DAY: 200,
} as const;

// Theory Configuration
export const THEORY_CONFIG = {
  MAX_LENGTH: 280,
  MIN_EVIDENCE_TAGS: 1,
  MIN_VOTES_FOR_CANON: 5,
  DAILY_VOTE_LIMIT: 10,
  SUBMISSION_WINDOW_HOURS: 12,
  VOTING_WINDOW_HOURS: 12,
} as const;

// Badge Configuration
export const BADGES = {
  FIRST_CANON: 'First Canon',
  TRENDSETTER: 'Trendsetter',
  CONSISTENT: 'Consistent',
  INFLUENCER: 'Influencer',
  STORY_WEAVER: 'Story Weaver',
} as const;

export const BADGE_REQUIREMENTS = {
  [BADGES.FIRST_CANON]: { canonized: 1 },
  [BADGES.TRENDSETTER]: { votes_received: 50 },
  [BADGES.CONSISTENT]: { streak_days: 30 },
  [BADGES.INFLUENCER]: { votes_received: 500 },
  [BADGES.STORY_WEAVER]: { canonized: 10 },
} as const;

// Single source of truth for badge display (icon + accent color as a hex number).
// Keyed by the exact badge names above so award logic and UI never drift apart.
export const BADGE_META: Record<string, { icon: string; color: number }> = {
  [BADGES.FIRST_CANON]: { icon: '🏆', color: 0xffd700 },
  [BADGES.TRENDSETTER]: { icon: '📈', color: 0x22c55e },
  [BADGES.CONSISTENT]: { icon: '🔥', color: 0xf59e0b },
  [BADGES.INFLUENCER]: { icon: '🌟', color: 0x38bdf8 },
  [BADGES.STORY_WEAVER]: { icon: '🧩', color: 0xe94560 },
};

// Redis Key Patterns
export const REDIS_KEYS = {
  USER: (userId: string) => `user:${userId}`,
  USER_DAILY_VOTES: (userId: string) => `user:${userId}:daily_votes`,
  CHAPTER: (chapterId: string) => `chapter:${chapterId}`,
  STORY_CURRENT_ARC: 'story:current_arc',
  STORY_CURRENT_CHAPTER: 'story:current_chapter',
  THEORY: (theoryId: string) => `theory:${theoryId}`,
  THEORIES_BY_CHAPTER: (chapterId: string) => `theories:chapter:${chapterId}`,
  THEORIES_CANON: 'theories:canon',
  THEORIES_TRENDING: 'theories:trending',
  VOTES_BY_THEORY: (theoryId: string) => `votes:theory:${theoryId}`,
  VOTING_ACTIVE: 'voting:active',
  VOTING_PHASE: 'voting:phase',
  VOTING_ENDS_AT: 'voting:ends_at',
  LEADERBOARD_XP: 'leaderboard:xp',
  LEADERBOARD_CANON_RATE: 'leaderboard:canon_rate',
  LEADERBOARD_VOTES_RECEIVED: 'leaderboard:votes_received',
} as const;

// Voting Phases
export const VOTING_PHASES = {
  SUBMISSION: 'submission',
  VOTING: 'voting',
  CLOSED: 'closed',
} as const;

export type VotingPhaseType = typeof VOTING_PHASES[keyof typeof VOTING_PHASES];
