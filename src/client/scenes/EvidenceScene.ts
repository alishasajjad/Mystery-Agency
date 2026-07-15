import { Scene, GameObjects } from 'phaser';
import { Chapter } from '../../shared/types';
import { ApiClient } from '../api';
import { GlassCard, PremiumButton, SceneTransitions, HUD, ScrollView, InfoModal, HOW_TO_PLAY_STEPS, COLORS } from '../components/UIComponents';

const CLUE_TYPE_META: Record<string, { label: string; color: string; icon: string }> = {
  evidence: { label: 'EVIDENCE', color: '#38bdf8', icon: '🔎' },
  dialogue: { label: 'TESTIMONY', color: '#22c55e', icon: '💬' },
  document: { label: 'DOCUMENT', color: '#f59e0b', icon: '📄' },
};

export class EvidenceScene extends Scene {
  private chapter: Chapter | null = null;
  private loadingText: GameObjects.Text | null = null;
  private scrollView: ScrollView | null = null;

  constructor() {
    super({ key: 'EvidenceScene' });
  }

  init() {
    this.chapter = null;
    this.loadingText = null;
    this.scrollView = null;
  }

  async create() {
    this.add.rectangle(512, 384, 1024, 768, COLORS.background);
    const gradient = this.add.rectangle(512, 384, 1024, 768, COLORS.backgroundGradient).setAlpha(0.3);
    this.tweens.add({ targets: gradient, alpha: 0.5, duration: 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.loadingText = this.add.text(512, 360, 'Loading chapter…', {
      fontSize: '24px', color: COLORS.text, fontStyle: 'bold',
    }).setOrigin(0.5);
    const spinner = this.add.circle(512, 420, 20, COLORS.accent).setStrokeStyle(3, COLORS.highlight);
    this.tweens.add({ targets: spinner, rotation: Math.PI * 2, duration: 1000, repeat: -1, ease: 'Linear' });

    try {
      const [chapterResponse, profileResponse] = await Promise.all([
        ApiClient.getChapter(),
        ApiClient.getProfile().catch(() => null),
      ]);
      this.chapter = chapterResponse.chapter;

      this.loadingText.destroy();
      spinner.destroy();
      gradient.destroy();

      HUD.create(this);
      this.events.once('shutdown', () => HUD.destroy());
      const chapterNum = this.chapter ? this.chapter.id.replace('chapter', '') : '?';
      HUD.update({
        username: profileResponse?.user.username ?? 'Detective',
        xp: profileResponse?.user.xp ?? 0,
        rank: profileResponse?.user.rank ?? 'Rookie',
        chapter: `Chapter ${chapterNum}`,
      });

      this.buildScene();
    } catch (error) {
      console.error('Failed to load chapter:', error);
      this.loadingText.setText('Failed to load chapter. Please try again.');
      spinner.destroy();
      gradient.destroy();
      PremiumButton.create(this, 512, 450, 200, 50, 'RETRY', () => this.scene.restart(), { color: 0xe94560, hoverColor: 0xff6b6b });
      PremiumButton.create(this, 512, 520, 200, 50, 'BACK', () => SceneTransitions.fade(this, 'MainMenu'), { color: COLORS.primary, hoverColor: COLORS.secondary });
    }
  }

  private buildScene() {
    // --- Fixed top bar (below the HUD) ---
    PremiumButton.create(this, 66, 92, 92, 36, '← BACK', () => SceneTransitions.fade(this, 'MainMenu'), { color: 0x64748b, hoverColor: 0x94a3b8, fontSize: 14, glow: false });
    this.add.text(512, 92, (this.chapter?.title || 'Mystery Evidence').toUpperCase(), {
      fontSize: '24px', color: '#ffd700', fontStyle: 'bold', fontFamily: 'Arial Black',
      shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 4, fill: true },
      wordWrap: { width: 720 }, align: 'center',
    }).setOrigin(0.5);
    PremiumButton.create(this, 958, 92, 44, 36, '?', () => this.showHowToPlay(), { color: COLORS.primary, hoverColor: COLORS.highlight, fontSize: 18, glow: false });

    // --- Scrollable body ---
    const VIEW_TOP = 122;
    const VIEW_H = 560;
    this.scrollView = new ScrollView(this, 512, VIEW_TOP, 960, VIEW_H);
    let y = 8; // content-local top cursor

    // Story / briefing card (height adapts to the content text).
    y = this.addStoryCard(y);

    // Section heading.
    this.scrollView.add(this.add.text(512, y + 16, '🔍 EVIDENCE & CLUES', {
      fontSize: '20px', color: '#ffd700', fontStyle: 'bold', fontFamily: 'Arial Black',
      shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 4, fill: true },
    }).setOrigin(0.5));
    y += 44;

    // Clue cards (adaptive height, fully contained text).
    (this.chapter?.clues ?? []).forEach((clue, index) => { y = this.addClueCard(clue, index, y); });

    y += 12;
    this.scrollView.setContentHeight(y);

    // --- Fixed bottom action bar ---
    PremiumButton.create(this, 190, 712, 250, 48, '✍️ SUBMIT THEORY', () => this.scene.start('TheoryScene', { chapter: this.chapter }), { color: 0xe94560, hoverColor: 0xff6b6b, fontSize: 17, glow: true });
    PremiumButton.create(this, 428, 712, 200, 48, 'VIEW THEORIES', () => SceneTransitions.fade(this, 'TheoryListScene'), { color: COLORS.primary, hoverColor: COLORS.secondary, fontSize: 15 });
    PremiumButton.create(this, 642, 712, 200, 48, 'LEADERBOARD', () => SceneTransitions.fade(this, 'LeaderboardScene'), { color: COLORS.primary, hoverColor: COLORS.secondary, fontSize: 15 });
    PremiumButton.create(this, 852, 712, 150, 48, 'PROFILE', () => SceneTransitions.fade(this, 'ProfileScene'), { color: COLORS.primary, hoverColor: COLORS.secondary, fontSize: 15 });
  }

  private addStoryCard(topY: number): number {
    const CARD_W = 900;
    const text = this.add.text(0, 0, this.chapter?.content ?? '', {
      fontSize: '16px', color: COLORS.textSecondary, wordWrap: { width: CARD_W - 60 }, align: 'center', lineSpacing: 3,
    }).setOrigin(0.5, 0);
    const cardH = Math.max(96, text.height + 44);
    text.setPosition(0, -cardH / 2 + 22);
    const card = GlassCard.create(this, 512, topY + cardH / 2, CARD_W, cardH, [text], { borderColor: COLORS.highlight });
    this.scrollView!.add(card);
    return topY + cardH + 20;
  }

  private addClueCard(clue: { description: string; type: string; id: string }, index: number, topY: number): number {
    const CARD_W = 900;
    const meta = CLUE_TYPE_META[clue.type] ?? { label: clue.type.toUpperCase(), color: COLORS.textMuted, icon: '📌' };
    const textLeft = -CARD_W / 2 + 96; // left edge of the text column
    const textWidth = CARD_W - 150; // right edge stays inside the card

    // Build + measure the description first so the card height fits it exactly.
    const desc = this.add.text(textLeft, 0, clue.description, {
      fontSize: '15px', color: COLORS.text, wordWrap: { width: textWidth }, lineSpacing: 2,
    }).setOrigin(0, 0);
    const cardH = Math.max(84, desc.height + 58);
    desc.setPosition(textLeft, -cardH / 2 + 40);

    const iconCircle = this.add.circle(-CARD_W / 2 + 46, 0, 26, COLORS.secondary).setStrokeStyle(2, COLORS.accent);
    const icon = this.add.text(-CARD_W / 2 + 46, 0, meta.icon, { fontSize: '20px' }).setOrigin(0.5);
    const number = this.add.text(textLeft, -cardH / 2 + 18, `CLUE #${index + 1}`, {
      fontSize: '12px', color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    const typeTag = this.add.text(textLeft + 92, -cardH / 2 + 18, meta.label, {
      fontSize: '11px', color: meta.color, fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const card = GlassCard.create(this, 512, topY + cardH / 2, CARD_W, cardH, [iconCircle, icon, number, typeTag, desc], { borderColor: COLORS.highlight });
    this.scrollView!.add(card);
    return topY + cardH + 16;
  }

  private showHowToPlay() {
    InfoModal.show(this, '🔍 HOW TO PLAY', HOW_TO_PLAY_STEPS, { height: 470 });
  }

  shutdown() {
    // ScrollView + HUD self-clean via the shutdown event; kill tweens/timers here.
    this.scrollView = null;
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
