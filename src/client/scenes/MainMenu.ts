import { Scene, GameObjects, Math as PhaserMath } from 'phaser';
import { PremiumButton, SceneTransitions, ToastManager, InfoModal, HOW_TO_PLAY_STEPS, COLORS } from '../components/UIComponents';
import { ApiClient } from '../api';
import { phaseStatusLine, notifyPhaseChange } from '../phase';

export class MainMenu extends Scene {
  title: GameObjects.Text | null = null;
  particles: GameObjects.Rectangle[] = [];
  private adminClickTimer: ReturnType<typeof setTimeout> | null = null;
  private adminButtonShown = false;

  constructor() {
    super({ key: 'MainMenu' });
  }

  init(): void {
    this.title = null;
    this.particles = [];
    this.adminClickTimer = null;
    this.adminButtonShown = false;
  }

  create() {
    // Premium dark background with gradient
    this.add.rectangle(512, 384, 1024, 768, COLORS.background);
    
    // Add subtle gradient overlay for depth
    const gradient = this.add.rectangle(512, 384, 1024, 768, COLORS.backgroundGradient)
      .setAlpha(0.3);
    
    // Animate gradient for subtle movement
    this.tweens.add({
      targets: gradient,
      alpha: 0.5,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Create animated particles
    this.createParticles();

    // Create detective badge
    this.createDetectiveBadge();

    // Animated title
    this.createAnimatedTitle();

    // Subtitle
    const subtitle = this.add.text(512, 200, 'COLLABORATIVE MYSTERY SOLVING', {
      fontSize: '18px',
      color: '#38bdf8',
      fontStyle: 'bold',
      fontFamily: 'Arial',
      shadow: {
        offsetX: 0,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        fill: true,
      },
    }).setOrigin(0.5);

    // Animate subtitle
    subtitle.setAlpha(0);
    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      y: 200,
      duration: 1000,
      delay: 500,
      ease: 'Power2',
    });

    // Premium menu buttons
    this.createMenuButtons();

    // How to play (onboarding)
    PremiumButton.create(
      this, 512, 700, 220, 44, '❓ HOW TO PLAY',
      () => InfoModal.show(this, '🔍 HOW TO PLAY', HOW_TO_PLAY_STEPS, { height: 470 }),
      { color: COLORS.card, hoverColor: COLORS.cardHover, fontSize: 16, glow: false }
    );

    // Version info
    this.add.text(512, 750, 'v1.0.0', {
      fontSize: '12px',
      color: COLORS.textMuted,
      fontStyle: 'italic',
    }).setOrigin(0.5);

    // Admin mode toggle (triple click on title area — dev fallback)
    this.setupAdminToggle();

    // Reveal the ADMIN entry point for real subreddit moderators (server-checked).
    void this.checkAdminAccess();

    // Clear the DOM setTimeout on shutdown (Phaser's Clock does not manage it).
    this.events.once('shutdown', () => {
      if (this.adminClickTimer) {
        clearTimeout(this.adminClickTimer);
        this.adminClickTimer = null;
      }
    });
  }

  private createDetectiveBadge() {
    // Badge shield shape
    const badge = this.add.container(512, 140);
    
    // Shield background
    const shield = this.add.polygon(0, 0, [
      0, -40,
      30, -30,
      35, 0,
      30, 30,
      0, 45,
      -30, 30,
      -35, 0,
      -30, -30
    ], COLORS.accent)
      .setStrokeStyle(3, COLORS.highlight);
    
    // Inner star
    const star = this.add.polygon(0, 5, [
      0, -15,
      4, -5,
      14, -5,
      6, 2,
      9, 12,
      0, 6,
      -9, 12,
      -6, 2,
      -14, -5,
      -4, -5
    ], COLORS.primary)
      .setStrokeStyle(2, COLORS.accent);
    
    badge.add(shield);
    badge.add(star);
    
    // Animate badge
    badge.setScale(0);
    this.tweens.add({
      targets: badge,
      scale: 1,
      duration: 800,
      delay: 300,
      ease: 'Back',
    });
    
    // Floating animation
    this.tweens.add({
      targets: badge,
      y: 135,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Glow effect
    const glow = this.add.circle(512, 140, 50, COLORS.accent)
      .setAlpha(0.2)
      .setStrokeStyle(2, COLORS.accent);
    
    this.tweens.add({
      targets: glow,
      alpha: 0.4,
      scale: 1.2,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createParticles() {
    for (let i = 0; i < 30; i++) {
      const particle = this.add.rectangle(
        PhaserMath.Between(0, 1024),
        PhaserMath.Between(0, 768),
        PhaserMath.Between(2, 4),
        PhaserMath.Between(2, 4),
        0x38bdf8
      ).setAlpha(0.3);

      this.particles.push(particle);

      // Animate particle
      this.tweens.add({
        targets: particle,
        y: particle.y - PhaserMath.Between(100, 300),
        alpha: 0,
        duration: PhaserMath.Between(3000, 6000),
        delay: PhaserMath.Between(0, 2000),
        repeat: -1,
      });
    }
  }

  private createAnimatedTitle() {
    const title = this.add.text(512, 300, 'MYSTERY AGENCY', {
      fontSize: '52px',
      color: '#ffd700',
      fontStyle: 'bold',
      fontFamily: 'Arial Black',
      stroke: '#000000',
      strokeThickness: 10,
      shadow: {
        offsetX: 0,
        offsetY: 4,
        color: '#000000',
        blur: 8,
        fill: true,
      },
    }).setOrigin(0.5);

    // Enhanced glow effect
    const glow = this.add.text(512, 300, 'MYSTERY AGENCY', {
      fontSize: '52px',
      color: '#38bdf8',
      fontStyle: 'bold',
      fontFamily: 'Arial Black',
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#38bdf8',
        blur: 20,
        fill: true,
      },
    }).setOrigin(0.5).setAlpha(0.4);

    // Animate title
    title.setScale(0);
    glow.setScale(0);

    this.tweens.add({
      targets: [title, glow],
      scale: 1,
      duration: 1000,
      delay: 200,
      ease: 'Elastic',
    });

    // Enhanced pulse glow
    this.tweens.add({
      targets: glow,
      alpha: 0.6,
      scale: 1.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Letter-by-letter reveal effect
    const letters = title.text.split('');
    title.setText('');
    letters.forEach((letter, index) => {
      this.time.delayedCall(400 + index * 50, () => {
        title.setText(title.text + letter);
      });
    });

    this.title = title;
  }

  private createMenuButtons() {
    const buttonY = 400;
    const buttonSpacing = 75;

    // PLAY button (highlighted)
    const playButton = PremiumButton.create(
      this,
      512,
      buttonY,
      320,
      65,
      'PLAY',
      () => SceneTransitions.fade(this, 'EvidenceScene'),
      { color: 0xe94560, hoverColor: 0xff6b6b, fontSize: 26, glow: true }
    );

    // PROFILE button
    const profileButton = PremiumButton.create(
      this,
      512,
      buttonY + buttonSpacing,
      320,
      60,
      'PROFILE',
      () => SceneTransitions.fade(this, 'ProfileScene'),
      { color: COLORS.primary, hoverColor: COLORS.secondary, fontSize: 20 }
    );

    // LEADERBOARD button
    const leaderboardButton = PremiumButton.create(
      this,
      512,
      buttonY + buttonSpacing * 2,
      320,
      60,
      'LEADERBOARD',
      () => SceneTransitions.fade(this, 'LeaderboardScene'),
      { color: COLORS.primary, hoverColor: COLORS.secondary, fontSize: 20 }
    );

    // SETTINGS button
    const settingsButton = PremiumButton.create(
      this,
      512,
      buttonY + buttonSpacing * 3,
      320,
      60,
      'SETTINGS',
      () => SceneTransitions.fade(this, 'SettingsScene'),
      { color: COLORS.primary, hoverColor: COLORS.secondary, fontSize: 20 }
    );

    // NOTE: the ADMIN entry point is created by checkAdminAccess() based on the
    // server's real moderator check (top-right), not on a localStorage flag.

    // Stagger button animations
    const buttons = [playButton, profileButton, leaderboardButton, settingsButton];
    buttons.forEach((button, index) => {
      button.container.setAlpha(0);
      button.container.setY(button.container.y + 60);

      this.tweens.add({
        targets: button.container,
        alpha: 1,
        y: buttonY + buttonSpacing * index,
        duration: 600,
        delay: 1200 + index * 150,
        ease: 'Back',
      });
    });
  }

  private setupAdminToggle() {
    let clickCount = 0;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Simple area check for title (top center of screen)
      if (pointer.y < 200 && pointer.x > 300 && pointer.x < 724) {
        clickCount++;

        if (this.adminClickTimer) clearTimeout(this.adminClickTimer);

        this.adminClickTimer = setTimeout(() => {
          clickCount = 0;
        }, 500);
        
        if (clickCount === 3) {
          const enabling = localStorage.getItem('adminMode') !== 'true';
          localStorage.setItem('adminMode', enabling.toString());
          if (enabling) {
            this.showAdminButton('dev'); // appears immediately, no restart needed
            ToastManager.show(this, 'Dev admin mode enabled.', 'info');
          } else {
            ToastManager.show(this, 'Dev admin mode disabled. Restart to hide.', 'info');
          }
          clickCount = 0;
        }
      }
    });
  }

  /**
   * Decide whether to show the ADMIN entry point. Primary source is the server's
   * real moderator check; the localStorage flag is only a dev fallback.
   */
  private async checkAdminAccess() {
    const localFlag = localStorage.getItem('adminMode') === 'true';
    try {
      const status = await ApiClient.getAdminStatus();
      if (!this.sys.isActive()) return; // scene already left
      this.showPhaseBanner(phaseStatusLine(status.voting_phase), status.chapterId);
      notifyPhaseChange(this, status.voting_phase);
      if (status.isModerator || localFlag) {
        this.showAdminButton(status.isModerator ? 'moderator' : 'dev');
      }
    } catch (error) {
      console.error('Admin status check failed:', error);
      if (this.sys.isActive() && localFlag) this.showAdminButton('dev');
    }
  }

  private showPhaseBanner(statusLine: string, chapterId: string | null) {
    const num = chapterId ? chapterId.replace('chapter', '') : '?';
    const banner = this.add.text(512, 245, `CHAPTER ${num}   ·   ${statusLine}`, {
      fontSize: '15px', color: COLORS.textSecondary, fontStyle: 'bold', align: 'center',
      backgroundColor: '#0f172a', padding: { x: 14, y: 6 },
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: banner, alpha: 1, duration: 500 });
  }

  private showAdminButton(source: 'moderator' | 'dev') {
    if (this.adminButtonShown) return;
    this.adminButtonShown = true;
    const label = source === 'moderator' ? '🛠️ ADMIN' : '🛠️ ADMIN (dev)';
    const { container } = PremiumButton.create(
      this, 918, 40, 190, 42, label,
      () => SceneTransitions.fade(this, 'AdminScene'),
      { color: 0x64748b, hoverColor: 0x94a3b8, fontSize: 15, glow: false }
    );
    container.setAlpha(0);
    this.tweens.add({ targets: container, alpha: 1, duration: 400, ease: 'Power2' });
  }

  shutdown() {
    // Clear the admin triple-tap DOM timer (not a Phaser timer).
    if (this.adminClickTimer) {
      clearTimeout(this.adminClickTimer);
      this.adminClickTimer = null;
    }

    // Particles and other display objects are freed by the scene; just drop refs.
    this.particles = [];

    // Cleanup tweens, input listeners, and Phaser timers.
    this.tweens.killAll();
    this.input.removeAllListeners();
    this.time.removeAllEvents();
  }
}
