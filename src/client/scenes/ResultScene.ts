import { Scene } from 'phaser';
import { GlassCard, PremiumButton, SceneTransitions, COLORS } from '../components/UIComponents';

export class ResultScene extends Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  create(data: { success: boolean; message: string; xp_gained?: number }) {
    this.add.rectangle(512, 384, 1024, 768, COLORS.background);
    const gradient = this.add.rectangle(512, 384, 1024, 768, COLORS.backgroundGradient).setAlpha(0.3);
    this.tweens.add({ targets: gradient, alpha: 0.5, duration: 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const title = this.add.text(512, 150, data.success ? '✅ THEORY SUBMITTED!' : '⚠️ SOMETHING WENT WRONG', {
      fontSize: '40px', color: data.success ? '#22c55e' : '#ef4444', fontStyle: 'bold', fontFamily: 'Arial Black',
      shadow: { offsetX: 0, offsetY: 3, color: '#000000', blur: 6, fill: true }, wordWrap: { width: 900 }, align: 'center',
    }).setOrigin(0.5);
    title.setScale(0);
    this.tweens.add({ targets: title, scale: 1, duration: 500, ease: 'Back' });

    this.add.text(512, 220, data.message, {
      fontSize: '20px', color: COLORS.text, wordWrap: { width: 760 }, align: 'center',
    }).setOrigin(0.5);

    if (data.xp_gained) {
      this.add.text(512, 272, `+${data.xp_gained} XP`, {
        fontSize: '32px', color: '#ffd700', fontStyle: 'bold', fontFamily: 'Arial Black',
        shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 4, fill: true },
      }).setOrigin(0.5);
    }

    if (data.success) {
      // Make the next steps unmistakable so players never wonder "what now?".
      GlassCard.create(this, 512, 430, 760, 190, [
        this.add.text(0, -70, "WHAT HAPPENS NEXT?", { fontSize: '18px', color: '#ffd700', fontStyle: 'bold', fontFamily: 'Arial Black' }).setOrigin(0.5),
        this.add.text(0, -20, '🗳️  When a moderator opens VOTING, the community upvotes the best theories.', { fontSize: '15px', color: COLORS.textSecondary, wordWrap: { width: 700 }, align: 'center' }).setOrigin(0.5),
        this.add.text(0, 24, '🏆  The top-voted theory becomes CANON and shapes the next chapter.', { fontSize: '15px', color: COLORS.textSecondary, wordWrap: { width: 700 }, align: 'center' }).setOrigin(0.5),
        this.add.text(0, 64, '⭐  You earn +5 XP for every vote your theory receives.', { fontSize: '15px', color: COLORS.textSecondary, wordWrap: { width: 700 }, align: 'center' }).setOrigin(0.5),
      ], { borderColor: COLORS.highlight, glow: true });
    }

    PremiumButton.create(
      this, 512, 590, 280, 56, data.success ? 'VIEW COMMUNITY THEORIES' : 'BACK TO EVIDENCE',
      () => SceneTransitions.fade(this, data.success ? 'TheoryListScene' : 'EvidenceScene'),
      { color: 0xe94560, hoverColor: 0xff6b6b, fontSize: 18, glow: true }
    );

    PremiumButton.create(
      this, 512, 660, 200, 46, 'MAIN MENU',
      () => SceneTransitions.fade(this, 'MainMenu'),
      { color: COLORS.primary, hoverColor: COLORS.secondary, fontSize: 16, glow: false }
    );

    this.events.once('shutdown', () => {
      this.tweens.killAll();
      gradient.destroy();
    });
  }
}
