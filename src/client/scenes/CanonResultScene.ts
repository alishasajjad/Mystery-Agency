import { Scene, Math as PhaserMath } from 'phaser';
import { Theory } from '../../shared/types';
import { GlassCard, PremiumButton, Badge, SceneTransitions, ToastManager, COLORS } from '../components/UIComponents';

export class CanonResultScene extends Scene {
  constructor() {
    super({ key: 'CanonResultScene' });
  }

  create(data: { theory: Theory; xp_bonus: number }) {
    const { theory, xp_bonus } = data;

    // Premium dark background with gradient
    this.add.rectangle(512, 384, 1024, 768, COLORS.background);
    
    // Add subtle gradient overlay for depth
    const gradient = this.add.rectangle(512, 384, 1024, 768, COLORS.backgroundGradient)
      .setAlpha(0.3);
    
    // Animate gradient for celebration effect
    this.tweens.add({
      targets: gradient,
      alpha: 0.6,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Create enhanced celebration particles
    this.createConfetti();

    // Celebration border with glow
    const border = this.add.rectangle(512, 384, 1000, 728, COLORS.accent)
      .setStrokeStyle(4, COLORS.accent)
      .setAlpha(0.3);
    
    // Animate border pulse
    this.tweens.add({
      targets: border,
      alpha: 0.6,
      scale: 1.02,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Title card with icon
    GlassCard.create(
      this,
      512,
      80,
      700,
      60,
      [this.add.text(0, 0, '🎉 CANON THEORY SELECTED 🎉', {
        fontSize: '24px',
        color: '#ffd700',
        fontStyle: 'bold',
        fontFamily: 'Arial Black',
        shadow: {
          offsetX: 0,
          offsetY: 2,
          color: '#000000',
          blur: 4,
          fill: true,
        },
      }).setOrigin(0.5)],
      { borderColor: COLORS.accent, glow: true }
    );

    // Theory card with enhanced styling
    GlassCard.create(
      this,
      512,
      280,
      800,
      200,
      [
        this.add.text(0, -60, theory.content, {
          fontSize: '20px',
          color: COLORS.text,
          wordWrap: { width: 750 },
          fontStyle: 'bold',
        }).setOrigin(0.5),
        this.add.text(0, 40, `by ${theory.author_username}`, {
          fontSize: '18px',
          color: COLORS.textSecondary,
          fontStyle: 'italic',
        }).setOrigin(0.5),
      ],
      { borderColor: COLORS.highlight, glow: true }
    );

    // Stats section with icon
    this.add.text(512, 400, '📊 THEORY STATS', {
      fontSize: '20px',
      color: '#ffd700',
      fontStyle: 'bold',
      fontFamily: 'Arial Black',
      shadow: {
        offsetX: 0,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        fill: true,
      },
    }).setOrigin(0.5);

    // Vote count with icon
    GlassCard.create(
      this,
      350,
      460,
      200,
      70,
      [
        this.add.text(0, -15, '🗳️ VOTES', {
          fontSize: '14px',
          color: COLORS.textSecondary,
          fontStyle: 'bold',
        }).setOrigin(0.5),
        this.add.text(0, 15, `${theory.votes}`, {
          fontSize: '32px',
          color: '#e94560',
          fontStyle: 'bold',
          fontFamily: 'Arial Black',
          shadow: {
            offsetX: 0,
            offsetY: 2,
            color: '#000000',
            blur: 4,
            fill: true,
          },
        }).setOrigin(0.5),
      ],
      { borderColor: COLORS.danger }
    );

    // XP bonus with icon and animation
    const xpCard = GlassCard.create(
      this,
      674,
      460,
      200,
      70,
      [
        this.add.text(0, -15, '⭐ XP BONUS', {
          fontSize: '14px',
          color: COLORS.textSecondary,
          fontStyle: 'bold',
        }).setOrigin(0.5),
        this.add.text(0, 15, `+${xp_bonus}`, {
          fontSize: '32px',
          color: '#22c55e',
          fontStyle: 'bold',
          fontFamily: 'Arial Black',
          shadow: {
            offsetX: 0,
            offsetY: 2,
            color: '#000000',
            blur: 4,
            fill: true,
          },
        }).setOrigin(0.5),
      ],
      { borderColor: COLORS.success }
    );
    
    // Animate XP card
    xpCard.setScale(0);
    this.tweens.add({
      targets: xpCard,
      scale: 1.1,
      duration: 500,
      ease: 'Back',
      yoyo: true,
      repeat: 3,
    });

    // Theory type badge
    Badge.create(this, 512, 540, theory.theory_type.toUpperCase(), 'default');

    // View Next Chapter button
    PremiumButton.create(
      this,
      512,
      620,
      300,
      60,
      '📖 VIEW NEXT CHAPTER',
      () => SceneTransitions.fade(this, 'EvidenceScene'),
      { color: 0xe94560, hoverColor: 0xff6b6b, fontSize: 20, glow: true }
    );

    // Back to menu button
    PremiumButton.create(
      this,
      512,
      700,
      200,
      40,
      'MAIN MENU',
      () => SceneTransitions.fade(this, 'MainMenu'),
      { color: COLORS.primary, hoverColor: COLORS.secondary, fontSize: 16, glow: false }
    );

    // Show toast notification
    ToastManager.show(this, `+${xp_bonus} XP Bonus Awarded!`, 'success');
  }

  shutdown() {
    // Kill looping/confetti tweens and timers; display objects are freed by the scene.
    this.tweens.killAll();
    this.time.removeAllEvents();
  }

  private createConfetti() {
    const colors = [0xffd700, 0xe94560, 0x22c55e, 0x38bdf8, 0xf59e0b];
    
    for (let i = 0; i < 100; i++) {
      const x = PhaserMath.Between(100, 924);
      const y = PhaserMath.Between(100, 668);
      const color = colors[PhaserMath.Between(0, colors.length - 1)];
      
      const particle = this.add.rectangle(x, y, PhaserMath.Between(4, 8), PhaserMath.Between(4, 8), color);
      
      this.tweens.add({
        targets: particle,
        y: particle.y - PhaserMath.Between(100, 300),
        x: particle.x + PhaserMath.Between(-100, 100),
        alpha: 0,
        rotation: PhaserMath.Between(0, 360),
        duration: PhaserMath.Between(2000, 4000),
        delay: PhaserMath.Between(0, 1000),
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }
}
