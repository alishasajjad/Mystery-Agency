import { Scene, GameObjects } from 'phaser';
import { ApiClient } from '../api';
import { GlassCard, PremiumButton, SceneTransitions, ToastManager, COLORS, DEPTH } from '../components/UIComponents';
import { phaseStatusLine } from '../phase';

export class AdminScene extends Scene {
  private confirmOverlay: GameObjects.Container | null = null;
  private statusText: GameObjects.Text | null = null;
  private autoBtnText: GameObjects.Text | null = null;
  private autoEnabled = true;

  constructor() {
    super({ key: 'AdminScene' });
  }

  init() {
    this.confirmOverlay = null;
    this.statusText = null;
    this.autoBtnText = null;
    this.autoEnabled = true;
  }

  create() {
    this.add.rectangle(512, 384, 1024, 768, COLORS.background);
    const gradient = this.add.rectangle(512, 384, 1024, 768, COLORS.backgroundGradient).setAlpha(0.3);
    this.tweens.add({ targets: gradient, alpha: 0.5, duration: 6000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    GlassCard.create(
      this, 512, 40, 460, 52,
      [this.add.text(0, 0, '🛠️ ADMIN PANEL', {
        fontSize: '22px', color: '#e94560', fontStyle: 'bold', fontFamily: 'Arial Black',
        shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 4, fill: true },
      }).setOrigin(0.5)],
      { borderColor: COLORS.danger, glow: true }
    );
    PremiumButton.create(this, 84, 40, 100, 38, '← BACK', () => SceneTransitions.fade(this, 'MainMenu'), { color: 0x64748b, hoverColor: 0x94a3b8, fontSize: 15, glow: false });

    // Live game-state indicator (refreshed after each action).
    this.statusText = this.add.text(512, 84, 'Loading game state…', {
      fontSize: '15px', color: COLORS.textSecondary, fontStyle: 'bold',
    }).setOrigin(0.5);
    void this.refreshStatus();

    this.sectionLabel(126, 'VOTING CONTROL  (manual override)');
    PremiumButton.create(this, 300, 166, 200, 46, 'OPEN SUBMISSIONS', () => this.run(() => ApiClient.setVotingPhase('submission'), 'Submissions opened'), { color: 0x38bdf8, hoverColor: 0x7dd3fc, fontSize: 14 });
    PremiumButton.create(this, 512, 166, 200, 46, 'OPEN VOTING', () => this.run(() => ApiClient.setVotingPhase('voting'), 'Voting opened'), { color: 0x22c55e, hoverColor: 0x4ade80, fontSize: 14 });
    PremiumButton.create(this, 724, 166, 200, 46, 'CLOSE VOTING', () => this.run(() => ApiClient.setVotingPhase('closed'), 'Voting closed'), { color: 0xe94560, hoverColor: 0xff6b6b, fontSize: 14 });

    this.sectionLabel(224, 'AUTOMATION  (auto-advances every 12h)');
    const autoBtn = PremiumButton.create(this, 300, 264, 200, 46, '⏸ PAUSE AUTO', () => this.run(() => ApiClient.setPhaseAuto(!this.autoEnabled), 'Automation updated'), { color: 0xf59e0b, hoverColor: 0xfbbf24, fontSize: 14 });
    this.autoBtnText = autoBtn.text;
    PremiumButton.create(this, 512, 264, 200, 46, '⏭ SKIP PHASE', () => this.run(() => ApiClient.skipPhase(), 'Advanced to next phase'), { color: COLORS.primary, hoverColor: COLORS.secondary, fontSize: 14 });
    PremiumButton.create(this, 724, 264, 200, 46, '🏆 AUTO-CANON', () => this.run(() => ApiClient.autoSelectCanon(), 'Canon theory selected'), { color: 0xffd700, hoverColor: 0xffe033, textColor: '#000000', fontSize: 14 });

    this.sectionLabel(322, 'CHAPTER & GAME');
    PremiumButton.create(this, 380, 362, 280, 46, '📖 ADVANCE CHAPTER', () => this.run(() => ApiClient.advanceChapter(), 'Chapter advanced'), { color: COLORS.primary, hoverColor: COLORS.secondary, fontSize: 15 });
    PremiumButton.create(this, 680, 362, 220, 46, '🔄 RESET GAME', () => this.confirmReset(), { color: 0xe94560, hoverColor: 0xff6b6b, fontSize: 15 });

    this.add.text(512, 440, 'Manual controls override the schedule; automation resumes from the phase you set. Pausing stops the 12h timer.', {
      fontSize: '13px', color: COLORS.textMuted, align: 'center', wordWrap: { width: 760 },
    }).setOrigin(0.5);
    this.add.text(512, 500, '⚠️ Admin actions require moderator permissions and are irreversible.', {
      fontSize: '13px', color: '#ff6b6b', fontStyle: 'bold', align: 'center', wordWrap: { width: 700 },
    }).setOrigin(0.5);

    this.events.once('shutdown', () => { this.tweens.killAll(); gradient.destroy(); });
  }

  private sectionLabel(y: number, text: string) {
    this.add.text(512, y, text, {
      fontSize: '16px', color: COLORS.text, fontStyle: 'bold', fontFamily: 'Arial Black',
      shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 4, fill: true },
    }).setOrigin(0.5);
  }

  /** Fetch and display the current chapter, phase, countdown, and automation state. */
  private async refreshStatus() {
    try {
      const status = await ApiClient.getAdminStatus();
      if (!this.sys.isActive() || !this.statusText) return;
      const vp = status.voting_phase;
      this.autoEnabled = vp.auto;
      const chapterNum = status.chapterId ? status.chapterId.replace('chapter', '') : '?';
      this.statusText.setText(`📖 Chapter ${chapterNum} / ${status.chapterCount}      •      ${phaseStatusLine(vp)}`);
      this.statusText.setColor(vp.phase === 'voting' ? '#22c55e' : vp.phase === 'submission' ? '#f59e0b' : '#94a3b8');
      this.autoBtnText?.setText(this.autoEnabled ? '⏸ PAUSE AUTO' : '▶ RESUME AUTO');
    } catch {
      if (this.sys.isActive()) this.statusText?.setText('Game state unavailable');
    }
  }

  /** Run an admin API call, surface success/failure via toast, and refresh state. */
  private async run(action: () => Promise<unknown>, successMessage: string) {
    try {
      await action();
      ToastManager.show(this, successMessage, 'success');
      await this.refreshStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Action failed';
      ToastManager.show(this, message, 'error');
    }
  }

  private confirmReset() {
    if (this.confirmOverlay) return;

    const overlay = this.add.container(512, 384).setDepth(DEPTH.MODAL);
    const dim = this.add.rectangle(0, 0, 1024, 768, 0x000000).setAlpha(0.7).setInteractive();
    const panel = this.add.rectangle(0, 0, 480, 240, COLORS.primary).setStrokeStyle(3, COLORS.danger);
    const title = this.add.text(0, -70, 'Reset the entire game?', { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    const body = this.add.text(0, -20, 'This returns the story to Chapter 1, clears all canon\nselections and submissions, and restarts the schedule.', {
      fontSize: '14px', color: COLORS.textSecondary, align: 'center',
    }).setOrigin(0.5);
    overlay.add([dim, panel, title, body]);

    const cancel = PremiumButton.create(this, -110, 70, 180, 46, 'CANCEL', () => this.closeConfirm(), { color: 0x64748b, hoverColor: 0x94a3b8, fontSize: 16, glow: false });
    const confirm = PremiumButton.create(this, 110, 70, 180, 46, 'RESET', () => {
      this.closeConfirm();
      void this.run(() => ApiClient.resetGame(), 'Game reset successfully');
    }, { color: 0xe94560, hoverColor: 0xff6b6b, fontSize: 16 });
    overlay.add([cancel.container, confirm.container]);

    this.confirmOverlay = overlay;
  }

  private closeConfirm() {
    this.confirmOverlay?.destroy();
    this.confirmOverlay = null;
  }

  shutdown() {
    this.closeConfirm();
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
