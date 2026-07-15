import { Scene } from 'phaser';
import { VotingPhase, VotingPhaseName } from '../shared/types';
import { ToastManager } from './components/UIComponents';

type PhaseInfo = { label: string; color: string; icon: string; announce: string; toast: 'success' | 'info' | 'error' };

export const PHASE_INFO: Record<VotingPhaseName, PhaseInfo> = {
  submission: {
    label: 'SUBMISSION',
    color: '#f59e0b',
    icon: '✍️',
    announce: '✍️ Theory submission is OPEN — submit your theory!',
    toast: 'info',
  },
  voting: {
    label: 'VOTING',
    color: '#22c55e',
    icon: '🗳️',
    announce: '🗳️ Voting is now OPEN — vote for the best theories!',
    toast: 'success',
  },
  closed: {
    label: 'CLOSED',
    color: '#94a3b8',
    icon: '🔒',
    announce: '🔒 This case is now closed.',
    toast: 'info',
  },
};

/** Human-readable time remaining, e.g. "5h 23m", "42m", or "soon". */
export function formatRemaining(ms: number): string {
  if (!ms || ms <= 0) return 'soon';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return 'soon';
}

/** One-line status: "🗳️ VOTING • auto-advances in 5h 23m" (or manual/paused). */
export function phaseStatusLine(vp: VotingPhase): string {
  const info = PHASE_INFO[vp.phase];
  if (vp.phase === 'closed') return `${info.icon} ${info.label}`;
  if (!vp.auto) return `${info.icon} ${info.label} • manual (auto paused)`;
  return `${info.icon} ${info.label} • next phase in ${formatRemaining(vp.remaining_ms)}`;
}

/**
 * Lightweight cross-scene notification: whenever the (chapter, phase) signature
 * changes since this device last saw it, toast the change. Silent on first sight.
 */
export function notifyPhaseChange(scene: Scene, vp: VotingPhase): void {
  const key = 'ma:phaseState';
  const chapterId = vp.chapter_id ?? '';
  const sig = `${chapterId}:${vp.phase}`;
  let prev: string | null;
  try {
    prev = localStorage.getItem(key);
    localStorage.setItem(key, sig);
  } catch {
    return; // localStorage unavailable — skip notifications
  }
  if (!prev || prev === sig) return;

  const prevChapter = prev.split(':')[0];
  if (prevChapter !== chapterId && chapterId) {
    const num = chapterId.replace('chapter', '');
    ToastManager.show(scene, `📖 New chapter released! Chapter ${num} is live.`, 'info', 4000);
  } else {
    const info = PHASE_INFO[vp.phase];
    ToastManager.show(scene, info.announce, info.toast, 4000);
  }
}
