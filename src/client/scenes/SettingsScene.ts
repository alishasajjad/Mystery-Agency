import { Scene } from 'phaser';
import { GlassCard, PremiumButton, SceneTransitions, ToastManager, InfoModal, HOW_TO_PLAY_STEPS, COLORS, DEPTH } from '../components/UIComponents';

export class SettingsScene extends Scene {
  constructor() {
    super({ key: 'SettingsScene' });
  }

  create() {
    this.add.rectangle(512, 384, 1024, 768, COLORS.background);
    const gradient = this.add.rectangle(512, 384, 1024, 768, COLORS.backgroundGradient).setAlpha(0.3);
    this.tweens.add({ targets: gradient, alpha: 0.5, duration: 9000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    GlassCard.create(
      this, 512, 50, 700, 60,
      [this.add.text(0, 0, '⚙️ SETTINGS', {
        fontSize: '24px', color: '#ffd700', fontStyle: 'bold', fontFamily: 'Arial Black',
        shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 4, fill: true },
      }).setOrigin(0.5)],
      { borderColor: COLORS.accent, glow: true }
    );
    PremiumButton.create(this, 100, 50, 100, 40, '← BACK', () => SceneTransitions.fade(this, 'MainMenu'), { color: 0x64748b, hoverColor: 0x94a3b8, fontSize: 16, glow: false });

    // GAME section (no audio system exists, so no audio toggles are shown).
    this.sectionLabel(150, '🎮 GAME');
    PremiumButton.create(this, 512, 210, 320, 56, '❓ HOW TO PLAY',
      () => InfoModal.show(this, '🔍 HOW TO PLAY', HOW_TO_PLAY_STEPS, { height: 470 }),
      { color: COLORS.primary, hoverColor: COLORS.secondary, fontSize: 18 });
    PremiumButton.create(this, 512, 282, 320, 56, '🔄 RESET LOCAL DATA',
      () => this.resetLocalData(),
      { color: 0xe94560, hoverColor: 0xff6b6b, fontSize: 18, glow: true });

    // ABOUT section.
    this.sectionLabel(372, 'ℹ️ ABOUT');
    GlassCard.create(this, 512, 500, 620, 180, [
      this.add.text(0, -62, '🔍 MYSTERY AGENCY', { fontSize: '20px', color: '#ffd700', fontStyle: 'bold', fontFamily: 'Arial Black' }).setOrigin(0.5),
      this.add.text(0, -30, 'Version 1.0.0', { fontSize: '14px', color: COLORS.textSecondary, fontStyle: 'italic' }).setOrigin(0.5),
      this.add.text(0, 2, 'A collaborative detective mystery for Reddit communities.', { fontSize: '14px', color: COLORS.textSecondary, align: 'center', wordWrap: { width: 560 } }).setOrigin(0.5),
    ], { borderColor: COLORS.highlight });
    PremiumButton.create(this, 512, 560, 300, 46, '📄 PRIVACY & TERMS',
      () => this.showPrivacyTerms(),
      { color: COLORS.card, hoverColor: COLORS.cardHover, fontSize: 16, glow: false });

    this.events.once('shutdown', () => { this.tweens.killAll(); gradient.destroy(); });
  }

  private sectionLabel(y: number, text: string) {
    this.add.text(512, y, text, {
      fontSize: '20px', color: '#ffd700', fontStyle: 'bold', fontFamily: 'Arial Black',
      shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 4, fill: true },
    }).setOrigin(0.5);
  }

  private showPrivacyTerms() {
    InfoModal.show(this, '📄 PRIVACY & TERMS', [
      'Mystery Agency only stores gameplay data tied to your Reddit account (username, XP, rank, badges, theories, and votes) via Reddit\'s Devvit platform.',
      'It does not collect emails, passwords, payment details, or track you outside the game. Moderators can reset game state.',
      'By playing you agree to fair play: no cheating, spam, or abuse. Full Privacy Policy and Terms are published with the app (see the README / app listing).',
    ], { height: 400 });
  }

  private resetLocalData() {
    // window.confirm is unreliable inside the Devvit iframe — use an in-scene dialog.
    const overlay = this.add.container(512, 384).setDepth(DEPTH.MODAL);
    const dim = this.add.rectangle(0, 0, 1024, 768, 0x000000).setAlpha(0.7).setInteractive();
    const panel = this.add.rectangle(0, 0, 460, 220, COLORS.primary).setStrokeStyle(3, COLORS.danger);
    const title = this.add.text(0, -60, 'Reset local data?', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    const body = this.add.text(0, -15, 'Clears this device\'s local preferences and\nnotification history. Your account progress is safe.', {
      fontSize: '14px', color: COLORS.textSecondary, align: 'center',
    }).setOrigin(0.5);
    overlay.add([dim, panel, title, body]);

    const cancel = PremiumButton.create(this, -100, 60, 170, 44, 'CANCEL', () => overlay.destroy(), { color: 0x64748b, hoverColor: 0x94a3b8, fontSize: 15, glow: false });
    const confirm = PremiumButton.create(this, 100, 60, 170, 44, 'RESET', () => {
      try { localStorage.clear(); } catch { /* ignore */ }
      overlay.destroy();
      ToastManager.show(this, 'Local data reset.', 'info');
      this.time.delayedCall(800, () => SceneTransitions.fade(this, 'MainMenu'));
    }, { color: 0xe94560, hoverColor: 0xff6b6b, fontSize: 15 });
    overlay.add([cancel.container, confirm.container]);
  }
}
