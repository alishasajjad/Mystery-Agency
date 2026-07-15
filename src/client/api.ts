import type { Chapter, Theory, VotingPhase, LeaderboardEntry, LeaderboardType, User } from '../shared/types';

const API_BASE_URL = '/api';

type ApiError = { error?: string; message?: string; status?: string };

/**
 * Thin fetch wrapper around the game API. Identity is provided by Devvit's
 * request context server-side — the client never sends a user id.
 */
export class ApiClient {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });

    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const body = (await response.json()) as ApiError;
        message = body.error || body.message || message;
      } catch {
        // non-JSON error body; keep the generic message
      }
      throw new Error(message);
    }

    return (await response.json()) as T;
  }

  static getProfile(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/profile');
  }

  static getChapter(): Promise<{ chapter: Chapter | null }> {
    return this.request<{ chapter: Chapter | null }>('/chapter');
  }

  static getTheories(): Promise<{ chapter: Chapter | null; theories: Theory[]; voting_phase: VotingPhase }> {
    return this.request('/theories');
  }

  static submitTheory(data: {
    content: string;
    theory_type: string;
    evidence_tags: string[];
  }): Promise<{ theory: Theory; xp_gained: number }> {
    return this.request('/theories', { method: 'POST', body: JSON.stringify(data) });
  }

  static voteForTheory(theoryId: string): Promise<{ theory: Theory; xp_gained: number }> {
    return this.request(`/theories/${theoryId}/vote`, { method: 'POST' });
  }

  static getLeaderboard(type: LeaderboardType = 'xp'): Promise<{ leaderboard: LeaderboardEntry[]; type: LeaderboardType }> {
    return this.request(`/leaderboard?type=${type}`);
  }

  static claimDailyLogin(): Promise<{ xp_gained: number; already_claimed: boolean }> {
    return this.request('/daily-login', { method: 'POST' });
  }

  static getAdminStatus(): Promise<{
    userId: string | null;
    username: string | null;
    subreddit: string | null;
    isModerator: boolean;
    adminAccess: boolean;
    phase: 'submission' | 'voting' | 'closed';
    chapterId: string | null;
  }> {
    return this.request('/admin/status');
  }

  // --- Moderator-only (server enforces authorization; non-mods get 403) ---
  static setVotingPhase(phase: 'submission' | 'voting' | 'closed'): Promise<{ message: string; phase: string }> {
    return this.request('/voting-phase', { method: 'POST', body: JSON.stringify({ phase }) });
  }

  static autoSelectCanon(): Promise<{ theory: Theory; message: string }> {
    return this.request('/theories/auto-canon', { method: 'POST' });
  }

  static advanceChapter(): Promise<{ message: string; nextChapterId: string }> {
    return this.request('/chapter/advance', { method: 'POST' });
  }

  static resetGame(): Promise<{ message: string }> {
    return this.request('/admin/reset', { method: 'POST' });
  }
}
