import { Scene } from 'phaser';
import { GlassCard, PremiumButton, SceneTransitions, ToastManager, COLORS, DEPTH } from '../components/UIComponents';

export class SettingsScene extends Scene {
  private musicEnabled: boolean = true;
  private soundEnabled: boolean = true;

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create() {
    // Load settings from localStorage if available
    const savedMusic = localStorage.getItem('musicEnabled');
    const savedSound = localStorage.getItem('soundEnabled');
    
    if (savedMusic !== null) this.musicEnabled = savedMusic === 'true';
    if (savedSound !== null) this.soundEnabled = savedSound === 'true';

    // Premium dark background with gradient
    this.add.rectangle(512, 384, 1024, 768, COLORS.background);
    
    // Add subtle gradient overlay for depth
    const gradient = this.add.rectangle(512, 384, 1024, 768, COLORS.backgroundGradient)
      .setAlpha(0.3);
    
    // Animate gradient for subtle movement
    this.tweens.add({
      targets: gradient,
      alpha: 0.5,
      duration: 9000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Title card with icon
    GlassCard.create(
      this,
      512,
      50,
      700,
      60,
      [this.add.text(0, 0, '⚙️ SETTINGS', {
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

    // Back button
    PremiumButton.create(
      this,
      100,
      50,
      100,
      40,
      '← BACK',
      () => SceneTransitions.fade(this, 'MainMenu'),
      { color: 0x64748b, hoverColor: 0x94a3b8, fontSize: 16, glow: false }
    );

    // Audio Settings Section with icon
    this.add.text(512, 130, '🎵 AUDIO', {
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

    // Music toggle card with modern switch design
    this.createToggleCard(350, 200, 'MUSIC', this.musicEnabled, () => {
      this.musicEnabled = !this.musicEnabled;
      localStorage.setItem('musicEnabled', this.musicEnabled.toString());
      this.scene.restart();
    });

    // Sound toggle card with modern switch design
    this.createToggleCard(674, 200, 'SOUND', this.soundEnabled, () => {
      this.soundEnabled = !this.soundEnabled;
      localStorage.setItem('soundEnabled', this.soundEnabled.toString());
      this.scene.restart();
    });

    // Game Settings Section with icon
    this.add.text(512, 320, '🎮 GAME', {
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

    // Reset Progress button
    PremiumButton.create(
      this,
      512,
      400,
      300,
      60,
      '🔄 RESET PROGRESS',
      () => this.resetProgress(),
      { color: 0xe94560, hoverColor: 0xff6b6b, fontSize: 20, glow: true }
    );

    // Info section
    GlassCard.create(
      this,
      512,
      550,
      500,
      120,
      [
        this.add.text(0, -40, '🔍 MYSTERY AGENCY', {
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
        }).setOrigin(0.5),
        this.add.text(0, -10, 'Version 1.0.0', {
          fontSize: '16px',
          color: COLORS.textSecondary,
          fontStyle: 'italic',
        }).setOrigin(0.5),
        this.add.text(0, 20, 'A collaborative mystery solving game', {
          fontSize: '14px',
          color: COLORS.textSecondary,
        }).setOrigin(0.5),
      ],
      { borderColor: COLORS.highlight }
    );
    
    // Cleanup gradient on scene shutdown
    this.events.on('shutdown', () => {
      gradient.destroy();
    });
  }

  private createToggleCard(x: number, y: number, label: string, enabled: boolean, onToggle: () => void) {
    // Toggle container
    const container = this.add.container(x, y);
    
    // Card background
    const cardBg = this.add.rectangle(0, 0, 250, 80, COLORS.card)
      .setStrokeStyle(3, enabled ? COLORS.success : COLORS.danger)
      .setInteractive({ useHandCursor: true });
    
    // Label
    const labelText = this.add.text(-80, 0, label, {
      fontSize: '16px',
      color: COLORS.textSecondary,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    // Toggle switch background
    const switchBg = this.add.rectangle(80, 0, 60, 30, enabled ? COLORS.success : COLORS.danger)
      .setAlpha(0.3);
    
    // Toggle switch knob
    const switchKnob = this.add.circle(enabled ? 65 : 95, 0, 12, enabled ? COLORS.success : COLORS.danger);
    
    // Status text
    const statusText = this.add.text(80, 0, enabled ? 'ON' : 'OFF', {
      fontSize: '12px',
      color: enabled ? '#22c55e' : '#ef4444',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);
    
    container.add(cardBg);
    container.add(labelText);
    container.add(switchBg);
    container.add(switchKnob);
    container.add(statusText);
    
    // Hover effect (fillColor set directly — Phaser has no tweenable `fillStyle`).
    cardBg.on('pointerover', () => cardBg.setFillStyle(COLORS.cardHover));
    cardBg.on('pointerout', () => cardBg.setFillStyle(COLORS.card));

    // Toggle animation
    cardBg.on('pointerdown', () => {
      const nextColor = enabled ? COLORS.danger : COLORS.success;
      // The knob slide is a real (numeric) tween; colors are set directly.
      this.tweens.add({ targets: switchKnob, x: enabled ? 95 : 65, duration: 300, ease: 'Back' });
      switchBg.setFillStyle(nextColor);
      switchKnob.setFillStyle(nextColor);
      cardBg.setStrokeStyle(3, nextColor);
      this.tweens.add({ targets: statusText, alpha: 1, duration: 200, yoyo: true, repeat: 1 });

      // Call toggle (persists + restarts the scene) after the animation.
      this.time.delayedCall(300, onToggle);
    });
  }

  private resetProgress() {
    // window.confirm is unreliable inside the Devvit iframe — use an in-scene dialog.
    const overlay = this.add.container(512, 384).setDepth(DEPTH.MODAL);
    const dim = this.add.rectangle(0, 0, 1024, 768, 0x000000).setAlpha(0.7).setInteractive();
    const panel = this.add.rectangle(0, 0, 460, 220, COLORS.primary).setStrokeStyle(3, COLORS.danger);
    const title = this.add.text(0, -60, 'Reset local settings?', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    const body = this.add.text(0, -15, 'This clears your saved audio & display\npreferences on this device.', {
      fontSize: '14px', color: COLORS.textSecondary, align: 'center',
    }).setOrigin(0.5);
    overlay.add([dim, panel, title, body]);

    const cancel = PremiumButton.create(this, -100, 60, 170, 44, 'CANCEL', () => overlay.destroy(), { color: 0x64748b, hoverColor: 0x94a3b8, fontSize: 15, glow: false });
    const confirm = PremiumButton.create(this, 100, 60, 170, 44, 'RESET', () => {
      localStorage.clear();
      overlay.destroy();
      ToastManager.show(this, 'Settings reset.', 'info');
      this.time.delayedCall(800, () => SceneTransitions.fade(this, 'MainMenu'));
    }, { color: 0xe94560, hoverColor: 0xff6b6b, fontSize: 15 });
    overlay.add([cancel.container, confirm.container]);
  }
}
