// User Types
export type User = {
  username: string;
  xp: number;
  rank: string;
  theories_submitted: number;
  theories_canonized: number;
  votes_cast_today: number;
  last_vote_date: string;
  submission_streak: number;
  badges: string[];
  // Day (YYYY-MM-DD) the daily-login bonus was last claimed.
  last_login_date: string;
  // Day (YYYY-MM-DD) the votes_cast_today counter was last reset.
  votes_reset_date: string;
};

// Story Types
export type Chapter = {
  id: string;
  title: string;
  content: string;
  clues: Clue[];
  canon_theory: string | null;
  theory_type: TheoryType;
  created_at: number;
};

export type Clue = {
  id: string;
  description: string;
  type: 'evidence' | 'dialogue' | 'document';
};

export type StoryArc = {
  id: string;
  title: string;
  description: string;
  chapters: string[];
  current_chapter: string;
};

// Theory Types
export type TheoryType = 'suspect' | 'motive' | 'method' | 'prediction';

export type Theory = {
  id: string;
  author_id: string;
  author_username: string;
  chapter_id: string;
  content: string;
  theory_type: TheoryType;
  evidence_tags: string[];
  votes: number;
  is_canon: boolean;
  created_at: number;
};

// Voting Types
export type VotingPhaseName = 'submission' | 'voting' | 'closed';

export type VotingPhase = {
  active: boolean;
  phase: VotingPhaseName;
  ends_at: number;
};

// Leaderboard Types
export type LeaderboardType = 'xp' | 'canon_rate' | 'votes_received';

export type LeaderboardEntry = {
  username: string;
  xp: number;
  rank: string;
  theories_canonized: number;
  total_votes: number;
  // The raw score of the board being displayed (XP, canon count, or votes received).
  score: number;
};

// API Response Types
export type UserProfileResponse = {
  user: User;
  leaderboard_position?: number;
};

export type TheoriesResponse = {
  chapter: Chapter | null;
  theories: Theory[];
  voting_phase: VotingPhase;
};

export type SubmitTheoryResponse = {
  theory: Theory;
  xp_gained: number;
};

export type VoteResponse = {
  theory: Theory;
  xp_gained: number;
};

export type ChapterResponse = {
  chapter: Chapter | null;
  user_theories?: Theory[];
};

export type LeaderboardResponse = {
  leaderboard: LeaderboardEntry[];
  type: LeaderboardType;
};
