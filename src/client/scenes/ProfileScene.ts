import { Scene } from 'phaser';
import { User } from '../../shared/types';
import { BADGE_META, RANKS } from '../../shared/constants';
import { ApiClient } from '../api';
import { GlassCard, PremiumButton, Badge, SceneTransitions, COLORS } from '../components/UIComponents';

export class ProfileScene extends Scene {
  private user: User | null = null;
  private loadingText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'ProfileScene' });
  }

  async create() {
    // Premium dark background with gradient
    this.add.rectangle(512, 384, 1024, 768, COLORS.background);
    
    // Add subtle gradient overlay for depth
    const gradient = this.add.rectangle(512, 384, 1024, 768, COLORS.backgroundGradient)
      .setAlpha(0.3);
    
    // Animate gradient for subtle movement
    this.tweens.add({
      targets: gradient,
      alpha: 0.5,
      duration: 8000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Show loading state
    this.loadingText = this.add.text(512, 384, 'Loading profile...', {
      fontSize: '24px',
      color: COLORS.text,
      fontStyle: 'bold',
      shadow: {
        offsetX: 0,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        fill: true,
      },
    }).setOrigin(0.5);

    // Add loading spinner
    const spinner = this.add.circle(512, 430, 20, COLORS.accent)
      .setStrokeStyle(3, COLORS.highlight);
    
    this.tweens.add({
      targets: spinner,
      rotation: Math.PI * 2,
      duration: 1000,
      repeat: -1,
      ease: 'Linear',
    });

    try {
      // Load user profile from API
      const response = await ApiClient.getProfile();
      this.user = response.user;

      // Clear loading state
      this.loadingText?.destroy();
      spinner.destroy();
      gradient.destroy();
      
      this.buildScene();
    } catch (error) {
      console.error('Failed to load profile:', error);
      this.loadingText?.setText('Failed to load profile. Please try again.');
      spinner.destroy();
      gradient.destroy();

      // Add retry button
      PremiumButton.create(
        this,
        512,
        450,
        200,
        50,
        'RETRY',
        () => this.scene.restart(),
        { color: 0xe94560, hoverColor: 0xff6b6b }
      );

      // Add back button
      PremiumButton.create(
        this,
        512,
        520,
        200,
        50,
        'BACK',
        () => SceneTransitions.fade(this, 'MainMenu'),
        { color: COLORS.primary, hoverColor: COLORS.secondary }
      );
    }
  }

  private buildScene() {
    // Premium dark background
    this.add.rectangle(512, 384, 1024, 768, COLORS.background);

    // Title card with icon
    GlassCard.create(
      this,
      512,
      50,
      700,
      60,
      [this.add.text(0, 0, '👤 DETECTIVE PROFILE', {
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

    if (!this.user) {
      return;
    }

    // Avatar and username section
    this.createProfileHeader();

    // Stats cards
    this.createStatsCards();

    // Badges section
    this.createBadgesSection();
  }

  private createProfileHeader() {
    if (!this.user) return;

    // Avatar section with glow
    const avatarGlow = this.add.circle(512, 150, 65, COLORS.accent)
      .setAlpha(0.2)
      .setStrokeStyle(2, COLORS.accent);
    
    // Avatar placeholder
    this.add.circle(512, 150, 55, COLORS.secondary)
      .setStrokeStyle(4, COLORS.accent);

    // Avatar initial
    this.add.text(512, 150, this.user.username.charAt(0).toUpperCase(), {
      fontSize: '36px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Username with shadow
    this.add.text(512, 230, this.user.username, {
      fontSize: '32px',
      color: COLORS.text,
      fontStyle: 'bold',
      fontFamily: 'Arial Black',
      shadow: {
        offsetX: 0,
        offsetY: 3,
        color: '#000000',
        blur: 6,
        fill: true,
      },
    }).setOrigin(0.5);

    // Rank badge with icon
    Badge.create(this, 512, 275, `🎖️ ${this.user.rank}`, 'canon');
    
    // Animate avatar entrance
    avatarGlow.setScale(0);
    this.tweens.add({
      targets: avatarGlow,
      scale: 1,
      duration: 800,
      ease: 'Back',
    });
    
    // Pulse glow effect
    this.tweens.add({
      targets: avatarGlow,
      alpha: 0.4,
      scale: 1.1,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** Progress toward the next rank, plus a label ("X XP to <Rank>" or "MAX RANK"). */
  private rankProgress(): { fraction: number; label: string } {
    const xp = this.user?.xp ?? 0;
    const ranks = Object.values(RANKS).slice().sort((a, b) => a.min_xp - b.min_xp);
    let current = ranks[0]!;
    for (const r of ranks) if (xp >= r.min_xp) current = r;
    const next = ranks.find((r) => r.min_xp > xp);
    if (!next) return { fraction: 1, label: '★ MAX RANK' };
    const span = next.min_xp - current.min_xp;
    const fraction = span > 0 ? Math.max(0, Math.min(1, (xp - current.min_xp) / span)) : 1;
    return { fraction, label: `${(next.min_xp - xp).toLocaleString()} XP → ${next.name}` };
  }

  private createStatsCards() {
    if (!this.user) return;

    const statsY = 340;
    const statSpacing = 115;
    const rp = this.rankProgress();

    // XP card with real rank-progress bar
    GlassCard.create(
      this,
      300,
      statsY,
      250,
      100,
      [
        this.add.text(0, -32, '⭐ TOTAL XP', {
          fontSize: '14px',
          color: COLORS.textSecondary,
          fontStyle: 'bold',
        }).setOrigin(0.5),
        this.add.text(0, -6, this.user.xp.toLocaleString(), {
          fontSize: '30px',
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
        // Rank progress bar (background + proportional fill)
        this.add.rectangle(0, 28, 200, 8, COLORS.secondary).setStrokeStyle(1, COLORS.accent),
        this.add.rectangle(-100, 28, Math.max(4, 200 * rp.fraction), 6, COLORS.accent).setOrigin(0, 0.5),
        this.add.text(0, 44, rp.label, { fontSize: '10px', color: COLORS.textMuted }).setOrigin(0.5),
      ],
      { borderColor: COLORS.highlight }
    );

    // Theories card
    GlassCard.create(
      this,
      724,
      statsY,
      250,
      100,
      [
        this.add.text(0, -30, '💡 THEORIES', {
          fontSize: '14px',
          color: COLORS.textSecondary,
          fontStyle: 'bold',
        }).setOrigin(0.5),
        this.add.text(0, 0, this.user.theories_submitted.toString(), {
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

    // Canon theories card
    GlassCard.create(
      this,
      300,
      statsY + statSpacing,
      250,
      100,
      [
        this.add.text(0, -30, '🏆 CANON THEORIES', {
          fontSize: '14px',
          color: COLORS.textSecondary,
          fontStyle: 'bold',
        }).setOrigin(0.5),
        this.add.text(0, 0, this.user.theories_canonized.toString(), {
          fontSize: '32px',
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
      ],
      { borderColor: COLORS.accent }
    );

    // Votes today card
    GlassCard.create(
      this,
      724,
      statsY + statSpacing,
      250,
      100,
      [
        this.add.text(0, -30, '🗳️ VOTES TODAY', {
          fontSize: '14px',
          color: COLORS.textSecondary,
          fontStyle: 'bold',
        }).setOrigin(0.5),
        this.add.text(0, 0, `${this.user.votes_cast_today}`, {
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

    // Streak card
    GlassCard.create(
      this,
      512,
      statsY + statSpacing * 2,
      250,
      100,
      [
        this.add.text(0, -30, '🔥 SUBMISSION STREAK', {
          fontSize: '14px',
          color: COLORS.textSecondary,
          fontStyle: 'bold',
        }).setOrigin(0.5),
        this.add.text(0, 0, `${this.user.submission_streak} days`, {
          fontSize: '32px',
          color: '#f59e0b',
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
      { borderColor: COLORS.warning }
    );
  }

  private createBadgesSection() {
    if (!this.user) return;

    this.add.text(512, 620, '🏅 EARNED BADGES', {
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

    if (this.user.badges.length === 0) {
      this.add.text(512, 680, 'No badges earned yet.\nKeep solving mysteries!', {
        fontSize: '16px',
        color: COLORS.textSecondary,
        align: 'center',
      }).setOrigin(0.5);
    } else {
      this.displayBadges();
    }
  }

  private displayBadges() {
    if (!this.user) return;

    // Center the earned badges as a row. Icons/colors come from the shared
    // BADGE_META source of truth so display can never drift from award logic.
    const count = this.user.badges.length;
    const spacing = 200;
    const startX = 512 - ((count - 1) * spacing) / 2;

    this.user.badges.forEach((badge, index) => {
      const meta = BADGE_META[badge];
      const icon = meta?.icon ?? '🎖️';
      const color = meta?.color ?? COLORS.secondary;
      const xOffset = startX + index * spacing;

      const badgeCard = GlassCard.create(
        this,
        xOffset,
        680,
        180,
        60,
        [
          this.add.text(0, -10, icon, {
            fontSize: '24px',
          }).setOrigin(0.5),
          this.add.text(0, 15, badge, {
            fontSize: '11px',
            color: COLORS.text,
            fontStyle: 'bold',
            wordWrap: { width: 160 },
          }).setOrigin(0.5),
        ],
        { borderColor: color, glow: true }
      );

      // Animate badge entrance
      badgeCard.setScale(0);
      badgeCard.setAlpha(0);
      this.tweens.add({
        targets: badgeCard,
        scale: 1,
        alpha: 1,
        duration: 600,
        delay: index * 150,
        ease: 'Back',
      });
    });
  }

  shutdown() {
    // Cleanup loading text
    this.loadingText?.destroy();
    this.loadingText = null;
    
    // Cleanup user data
    this.user = null;
    
    // Cleanup tweens
    this.tweens.killAll();
    
    // Cleanup timers
    this.time.removeAllEvents();
  }
}
