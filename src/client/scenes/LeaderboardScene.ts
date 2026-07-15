import { Scene } from 'phaser';
import { LeaderboardEntry } from '../../shared/types';
import { ApiClient } from '../api';
import { GlassCard, PremiumButton, Badge, SceneTransitions, COLORS } from '../components/UIComponents';

export class LeaderboardScene extends Scene {
  private leaderboard: LeaderboardEntry[] = [];
  private currentUsername: string | null = null;
  private loadingText: Phaser.GameObjects.Text | null = null;
  private leaderboardType: 'xp' | 'canon_rate' | 'votes_received' = 'xp';

  constructor() {
    super({ key: 'LeaderboardScene' });
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
      duration: 7000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Show loading state
    this.loadingText = this.add.text(512, 384, 'Loading leaderboard...', {
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
      // Load user profile to get current username
      const profileResponse = await ApiClient.getProfile();
      this.currentUsername = profileResponse.user.username;

      // Load leaderboard
      const leaderboardResponse = await ApiClient.getLeaderboard(this.leaderboardType);
      this.leaderboard = leaderboardResponse.leaderboard;

      // Clear loading state
      this.loadingText?.destroy();
      spinner.destroy();
      gradient.destroy();
      
      this.buildScene();
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      this.loadingText?.setText('Failed to load leaderboard. Please try again.');
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
        () => SceneTransitions.fade(this, 'EvidenceScene'),
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
      [this.add.text(0, 0, '🏆 LEADERBOARD', {
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
      () => SceneTransitions.fade(this, 'EvidenceScene'),
      { color: 0x64748b, hoverColor: 0x94a3b8, fontSize: 16, glow: false }
    );

    // Leaderboard type tabs
    this.createTypeTabs();

    // Display leaderboard
    this.displayLeaderboard();
  }

  private createTypeTabs() {
    const tabs = [
      { type: 'xp' as const, label: 'XP', x: 350 },
      { type: 'canon_rate' as const, label: 'CANON', x: 512 },
      { type: 'votes_received' as const, label: 'VOTES', x: 674 },
    ];

    tabs.forEach((tab) => {
      const isActive = this.leaderboardType === tab.type;
      PremiumButton.create(
        this,
        tab.x,
        110,
        120,
        40,
        tab.label,
        () => {
          this.leaderboardType = tab.type;
          this.scene.restart();
        },
        { 
          color: isActive ? 0xe94560 : COLORS.card, 
          hoverColor: isActive ? 0xff6b6b : COLORS.secondary,
          fontSize: 16,
          glow: isActive
        }
      );
    });
  }

  private scoreLabel(): string {
    switch (this.leaderboardType) {
      case 'canon_rate': return 'CANON PTS';
      case 'votes_received': return 'VOTES';
      default: return 'XP';
    }
  }

  // Column x-offsets relative to a row card centered at x=512.
  private static readonly COLS = { rank: -360, name: -240, xp: 60, canon: 220, score: 350 };

  private displayLeaderboard() {
    if (this.leaderboard.length === 0) {
      this.add.text(512, 400, 'No leaderboard data yet.\nPlay to climb the ranks!', {
        fontSize: '20px',
        color: COLORS.textSecondary,
        align: 'center',
      }).setOrigin(0.5);
      return;
    }

    // Podium for top 3
    this.createPodium();

    const C = LeaderboardScene.COLS;
    // Column headers.
    const headerY = 435;
    const header = (dx: number, label: string, color = COLORS.textMuted) =>
      this.add.text(512 + dx, headerY, label, { fontSize: '12px', color, fontStyle: 'bold' }).setOrigin(0.5);
    header(C.rank, '#');
    header(C.name, 'DETECTIVE');
    header(C.xp, 'XP');
    header(C.canon, 'CANON');
    header(C.score, this.scoreLabel());

    // Rows 4+.
    let yOffset = 470;
    this.leaderboard.slice(3).forEach((entry, index) => {
      const rank = index + 4;
      const isCurrentPlayer = entry.username === this.currentUsername;

      GlassCard.create(
        this,
        512,
        yOffset,
        820,
        44,
        [
          this.add.text(C.rank, 0, `#${rank}`, { fontSize: '15px', color: COLORS.textSecondary }).setOrigin(0.5),
          this.add.text(C.name, 0, entry.username, {
            fontSize: '15px',
            color: isCurrentPlayer ? '#22c55e' : COLORS.text,
            fontStyle: isCurrentPlayer ? 'bold' : 'normal',
          }).setOrigin(0.5),
          this.add.text(C.xp, 0, entry.xp.toLocaleString(), { fontSize: '15px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5),
          this.add.text(C.canon, 0, entry.theories_canonized.toString(), { fontSize: '15px', color: COLORS.text }).setOrigin(0.5),
          this.add.text(C.score, 0, Math.round(entry.score).toLocaleString(), { fontSize: '15px', color: '#e94560' }).setOrigin(0.5),
        ],
        { borderColor: isCurrentPlayer ? 0x22c55e : COLORS.secondary, hover: false }
      );

      yOffset += 52;
    });
  }

  private createPodium() {
    if (this.leaderboard.length < 3) return;

    const top3 = this.leaderboard.slice(0, 3);
    const podiumData = [
      { rank: 2, entry: top3[1], x: 300, y: 350, height: 90, color: COLORS.silver, medal: '🥈' },
      { rank: 1, entry: top3[0], x: 512, y: 320, height: 130, color: COLORS.gold, medal: '🥇' },
      { rank: 3, entry: top3[2], x: 724, y: 380, height: 70, color: COLORS.bronze, medal: '🥉' },
    ];

    podiumData.forEach((data) => {
      if (!data.entry) return;

      // Podium base with glow
      const podiumBase = this.add.rectangle(data.x, data.y + data.height / 2, 160, data.height, data.color)
        .setStrokeStyle(4, data.color);
      
      // Add glow effect
      const glow = this.add.rectangle(data.x, data.y + data.height / 2, 170, data.height + 10, data.color)
        .setAlpha(0.3)
        .setStrokeStyle(2, data.color);

      // Medal icon
      this.add.text(data.x, data.y - 45, data.medal, {
        fontSize: '40px',
      }).setOrigin(0.5);

      // Rank badge
      Badge.create(this, data.x, data.y - 20, `#${data.rank}`, 'canon');

      // Avatar circle with initial
      this.add.circle(data.x, data.y + 10, 25, COLORS.secondary)
        .setStrokeStyle(3, data.color);
      
      this.add.text(data.x, data.y + 10, data.entry.username.charAt(0).toUpperCase(), {
        fontSize: '18px',
        color: '#ffd700',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Username
      this.add.text(data.x, data.y + 50, data.entry.username, {
        fontSize: '14px',
        color: COLORS.text,
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // XP with icon
      this.add.text(data.x, data.y + 70, `⭐ ${data.entry.xp.toLocaleString()}`, {
        fontSize: '12px',
        color: COLORS.textSecondary,
      }).setOrigin(0.5);
      
      // Animate podium entrance
      podiumBase.setScale(0);
      glow.setScale(0);
      
      this.tweens.add({
        targets: [podiumBase, glow],
        scale: 1,
        duration: 800,
        delay: 200,
        ease: 'Back',
      });
    });
  }

  shutdown() {
    // Cleanup loading text
    this.loadingText?.destroy();
    this.loadingText = null;
    
    // Cleanup tweens
    this.tweens.killAll();
    
    // Cleanup timers
    this.time.removeAllEvents();
  }
}
