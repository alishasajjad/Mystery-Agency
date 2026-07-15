import { Scene, GameObjects } from 'phaser';
import { ApiClient } from '../api';
import { GlassCard, PremiumButton, SceneTransitions, ToastManager, COLORS, DEPTH } from '../components/UIComponents';

const PHASE_META: Record<string, { label: string; color: string }> = {
  submission: { label: '✍️ SUBMISSION', color: '#f59e0b' },
  voting: { label: '🗳️ VOTING', color: '#22c55e' },
  closed: { label: '🔒 CLOSED', color: '#94a3b8' },
};

export class AdminScene extends Scene {
  private confirmOverlay: GameObjects.Container | null = null;
  private statusText: GameObjects.Text | null = null;

  constructor() {
    super({ key: 'AdminScene' });
  }

  init() {
    this.confirmOverlay = null;
    this.statusText = null;
  }

  create() {
    this.add.rectangle(512, 384, 1024, 768, COLORS.background);
    const gradient = this.add.rectangle(512, 384, 1024, 768, COLORS.backgroundGradient).setAlpha(0.3);
    this.tweens.add({ targets: gradient, alpha: 0.5, duration: 6000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    GlassCard.create(
      this, 512, 45, 500, 56,
      [this.add.text(0, 0, '🛠️ ADMIN PANEL', {
        fontSize: '24px', color: '#e94560', fontStyle: 'bold', fontFamily: 'Arial Black',
        shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 4, fill: true },
      }).setOrigin(0.5)],
      { borderColor: COLORS.danger, glow: true }
    );

    PremiumButton.create(this, 90, 45, 100, 40, '← BACK', () => SceneTransitions.fade(this, 'MainMenu'), { color: 0x64748b, hoverColor: 0x94a3b8, fontSize: 16, glow: false });

    // Live game-state indicator (refreshed after each action).
    this.statusText = this.add.text(512, 90, 'Loading game state…', {
      fontSize: '16px', color: COLORS.textSecondary, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(512, 114, 'Recommended flow:  Open Submissions  →  Open Voting  →  Auto-Select Canon  →  Advance Chapter', {
      fontSize: '12px', color: COLORS.textMuted,
    }).setOrigin(0.5);
    void this.refreshStatus();

    this.sectionLabel(150, 'VOTING CONTROL');
    PremiumButton.create(this, 300, 195, 200, 48, 'OPEN SUBMISSIONS', () => this.run(() => ApiClient.setVotingPhase('submission'), 'Submissions opened'), { color: 0x38bdf8, hoverColor: 0x7dd3fc, fontSize: 15 });
    PremiumButton.create(this, 512, 195, 200, 48, 'OPEN VOTING', () => this.run(() => ApiClient.setVotingPhase('voting'), 'Voting opened'), { color: 0x22c55e, hoverColor: 0x4ade80, fontSize: 15 });
    PremiumButton.create(this, 724, 195, 200, 48, 'CLOSE VOTING', () => this.run(() => ApiClient.setVotingPhase('closed'), 'Voting closed'), { color: 0xe94560, hoverColor: 0xff6b6b, fontSize: 15 });

    this.sectionLabel(270, 'CANON SELECTION');
    PremiumButton.create(this, 512, 320, 300, 48, 'AUTO-SELECT CANON', () => this.run(() => ApiClient.autoSelectCanon(), 'Canon theory selected'), { color: 0xffd700, hoverColor: 0xffe033, textColor: '#000000', fontSize: 16 });

    this.sectionLabel(395, 'CHAPTER PROGRESSION');
    PremiumButton.create(this, 512, 445, 300, 48, 'ADVANCE CHAPTER', () => this.run(() => ApiClient.advanceChapter(), 'Chapter advanced'), { color: COLORS.primary, hoverColor: COLORS.secondary, fontSize: 16 });

    this.sectionLabel(520, 'GAME MANAGEMENT');
    PremiumButton.create(this, 512, 570, 300, 48, '🔄 RESET GAME', () => this.confirmReset(), { color: 0xe94560, hoverColor: 0xff6b6b, fontSize: 16 });

    this.add.text(512, 660, '⚠️ Admin actions require moderator permissions and are irreversible', {
      fontSize: '13px', color: '#ff6b6b', fontStyle: 'bold', align: 'center', wordWrap: { width: 700 },
    }).setOrigin(0.5);

    this.events.once('shutdown', () => { this.tweens.killAll(); gradient.destroy(); });
  }

  private sectionLabel(y: number, text: string) {
    this.add.text(512, y, text, {
      fontSize: '18px', color: COLORS.text, fontStyle: 'bold', fontFamily: 'Arial Black',
      shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 4, fill: true },
    }).setOrigin(0.5);
  }

  /** Fetch and display the current chapter + voting phase. */
  private async refreshStatus() {
    try {
      const status = await ApiClient.getAdminStatus();
      if (!this.sys.isActive() || !this.statusText) return;
      const chapterNum = status.chapterId ? status.chapterId.replace('chapter', '') : '?';
      const phase = PHASE_META[status.phase] ?? { label: status.phase.toUpperCase(), color: COLORS.textSecondary };
      this.statusText.setText(`📖 Chapter ${chapterNum}      •      Phase: ${phase.label}`);
      this.statusText.setColor(phase.color);
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
    const body = this.add.text(0, -20, 'This returns the story to Chapter 1 and clears\nall canon selections. This cannot be undone.', {
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
