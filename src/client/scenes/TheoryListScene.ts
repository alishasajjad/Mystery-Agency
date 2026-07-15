import { Scene, GameObjects } from 'phaser';
import { Theory, VotingPhase } from '../../shared/types';
import { XP_VALUES } from '../../shared/constants';
import { ApiClient } from '../api';
import { GlassCard, PremiumButton, Badge, SceneTransitions, ToastManager, ScrollView, COLORS } from '../components/UIComponents';

type TheoryRow = {
  theory: Theory;
  arrow: GameObjects.Text;
  voteCountText: GameObjects.Text;
  hasVoted: boolean;
};

const ROW_HEIGHT = 128;
const ROW_GAP = 18;
const VIEW_TOP = 128;
const VIEW_H = 566;

export class TheoryListScene extends Scene {
  private theories: Theory[] = [];
  private rows: TheoryRow[] = [];
  private votingPhase: VotingPhase | null = null;
  private canonTheory: Theory | null = null;
  private scrollView: ScrollView | null = null;

  constructor() {
    super({ key: 'TheoryListScene' });
  }

  init() {
    this.theories = [];
    this.rows = [];
    this.votingPhase = null;
    this.canonTheory = null;
    this.scrollView = null;
  }

  async create() {
    this.add.rectangle(512, 384, 1024, 768, COLORS.background);
    const gradient = this.add.rectangle(512, 384, 1024, 768, COLORS.backgroundGradient).setAlpha(0.3);
    this.tweens.add({ targets: gradient, alpha: 0.5, duration: 6000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const loadingText = this.add.text(512, 360, 'Loading theories…', { fontSize: '24px', color: COLORS.text, fontStyle: 'bold' }).setOrigin(0.5);
    const spinner = this.add.circle(512, 420, 20, COLORS.accent).setStrokeStyle(3, COLORS.highlight);
    this.tweens.add({ targets: spinner, rotation: Math.PI * 2, duration: 1000, repeat: -1, ease: 'Linear' });

    try {
      const response = await ApiClient.getTheories();
      this.theories = response.theories;
      this.votingPhase = response.voting_phase;
      this.canonTheory = response.theories.find((t) => t.is_canon) ?? null;

      loadingText.destroy();
      spinner.destroy();
      gradient.destroy();
      this.buildScene();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load theories';
      loadingText.setText(message);
      spinner.destroy();
      gradient.destroy();
      PremiumButton.create(this, 512, 460, 200, 50, 'RETRY', () => this.scene.restart(), { color: 0xe94560, hoverColor: 0xff6b6b });
      PremiumButton.create(this, 512, 530, 200, 50, 'BACK', () => SceneTransitions.fade(this, 'EvidenceScene'), { color: COLORS.primary, hoverColor: COLORS.secondary });
    }
  }

  private buildScene() {
    // Fixed header.
    this.add.text(512, 42, '💬 COMMUNITY THEORIES', {
      fontSize: '24px', color: '#ffd700', fontStyle: 'bold', fontFamily: 'Arial Black',
      shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 4, fill: true },
    }).setOrigin(0.5);

    const phase = this.votingPhase?.phase;
    const phaseText = phase === 'voting'
      ? `🗳️ VOTING OPEN — Ends in ${this.getTimeRemaining(this.votingPhase!.ends_at)}`
      : phase === 'submission'
      ? '✍️ SUBMISSION PHASE — voting opens once a moderator starts it'
      : '🔒 VOTING CLOSED';
    const phaseColor = phase === 'voting' ? '#22c55e' : phase === 'submission' ? '#f59e0b' : COLORS.textSecondary;
    this.add.text(512, 78, phaseText, { fontSize: '14px', color: phaseColor, fontStyle: 'bold' }).setOrigin(0.5);

    PremiumButton.create(this, 66, 42, 92, 36, '← BACK', () => SceneTransitions.fade(this, 'EvidenceScene'), { color: 0x64748b, hoverColor: 0x94a3b8, fontSize: 14, glow: false });

    if (this.canonTheory) {
      PremiumButton.create(this, 936, 42, 120, 36, '🏆 CANON', () => {
        this.scene.start('CanonResultScene', { theory: this.canonTheory, xp_bonus: XP_VALUES.THEORY_CANONIZED });
      }, { color: COLORS.accent, hoverColor: COLORS.accentGlow, textColor: '#000000', fontSize: 13 });
    }

    if (this.theories.length === 0) {
      this.add.text(512, 400, 'No theories submitted yet.\nBe the first to crack the case!', {
        fontSize: '20px', color: COLORS.textSecondary, align: 'center',
      }).setOrigin(0.5);
      return;
    }

    this.scrollView = new ScrollView(this, 512, VIEW_TOP, 980, VIEW_H);
    let y = 6;
    this.theories.forEach((theory) => {
      this.scrollView!.add(this.createTheoryRow(theory, y));
      y += ROW_HEIGHT + ROW_GAP;
    });
    this.scrollView.setContentHeight(y);
  }

  private createTheoryRow(theory: Theory, localY: number): GameObjects.Container {
    const row = this.add.container(512, localY);

    const card = GlassCard.create(this, 0, ROW_HEIGHT / 2, 900, ROW_HEIGHT, [
      this.add.circle(-400, 0, 26, COLORS.secondary).setStrokeStyle(3, COLORS.accent),
      this.add.text(-400, 0, theory.author_username.charAt(0).toUpperCase(), { fontSize: '20px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5),
      this.add.text(-360, -40, theory.author_username, { fontSize: '15px', color: COLORS.text, fontStyle: 'bold' }).setOrigin(0, 0.5),
      Badge.create(this, -215, -40, theory.theory_type.toUpperCase(), 'default'),
      this.add.text(-360, 6, theory.content.substring(0, 150) + (theory.content.length > 150 ? '…' : ''), {
        fontSize: '14px', color: COLORS.textSecondary, wordWrap: { width: 640 }, lineSpacing: 2,
      }).setOrigin(0, 0.5),
    ], { borderColor: theory.is_canon ? COLORS.accent : COLORS.secondary });
    row.add(card);

    if (theory.is_canon) {
      row.add(Badge.create(this, 352, -40 + ROW_HEIGHT / 2, '🏆 CANON', 'canon'));
    }

    const canVote = this.votingPhase?.phase === 'voting' && !theory.is_canon;
    const arrow = this.add.text(408, ROW_HEIGHT / 2 - 22, '▲', { fontSize: '26px', color: canVote ? '#22c55e' : COLORS.textMuted }).setOrigin(0.5);
    const voteCountText = this.add.text(408, ROW_HEIGHT / 2 + 4, `${theory.votes}`, { fontSize: '18px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);
    const voteLabel = this.add.text(408, ROW_HEIGHT / 2 + 26, 'votes', { fontSize: '11px', color: COLORS.textMuted }).setOrigin(0.5);
    row.add([arrow, voteCountText, voteLabel]);

    const rowRef: TheoryRow = { theory, arrow, voteCountText, hasVoted: false };
    this.rows.push(rowRef);

    if (canVote) {
      arrow.setInteractive({ useHandCursor: true });
      arrow.on('pointerover', () => { if (!rowRef.hasVoted) arrow.setColor('#4ade80').setScale(1.2); });
      arrow.on('pointerout', () => { if (!rowRef.hasVoted) arrow.setColor('#22c55e').setScale(1); });
      // Ignore the release if it ended a scroll drag rather than a tap.
      arrow.on('pointerup', () => { if (!this.scrollView?.wasDragged) void this.handleVote(rowRef); });
    }

    return row;
  }

  private async handleVote(row: TheoryRow) {
    if (row.hasVoted) return;
    row.hasVoted = true;
    row.arrow.disableInteractive();
    row.arrow.setColor(COLORS.textMuted).setScale(1);

    try {
      const response = await ApiClient.voteForTheory(row.theory.id);
      row.theory.votes = response.theory.votes;
      row.voteCountText.setText(`${row.theory.votes}`);
      row.arrow.setColor('#22c55e');
      ToastManager.show(this, `+${response.xp_gained} XP — Vote recorded!`, 'success');
    } catch (error) {
      row.hasVoted = false;
      row.arrow.setInteractive({ useHandCursor: true });
      row.arrow.setColor('#22c55e');
      const message = error instanceof Error ? error.message : 'Failed to vote';
      ToastManager.show(this, message, 'error');
    }
  }

  private getTimeRemaining(endsAt: number): string {
    const remaining = endsAt - Date.now();
    if (remaining <= 0) return 'soon';
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }

  shutdown() {
    // ScrollView self-cleans via the shutdown event.
    this.rows = [];
    this.scrollView = null;
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
