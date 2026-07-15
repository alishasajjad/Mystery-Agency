import { Scene, GameObjects } from 'phaser';
import { LeaderboardEntry, LeaderboardType } from '../../shared/types';
import { ApiClient } from '../api';
import { GlassCard, PremiumButton, SceneTransitions, COLORS } from '../components/UIComponents';

type TabDef = { type: LeaderboardType; label: string; icon: string };

const TABS: TabDef[] = [
  { type: 'xp', label: 'XP', icon: '⭐' },
  { type: 'canon_rate', label: 'CANON', icon: '🏆' },
  { type: 'votes_received', label: 'VOTES', icon: '🗳️' },
];

const META: Record<LeaderboardType, { subtitle: string; unit: string; empty: string }> = {
  xp: { subtitle: 'Ranked by total XP', unit: 'XP', empty: 'No detectives on the board yet.\nSolve cases and earn XP to claim the top spot.' },
  canon_rate: { subtitle: 'Ranked by canon theories', unit: 'CANON', empty: 'No canon theories yet.\nGet your theory voted canon to appear here.' },
  votes_received: { subtitle: 'Ranked by votes received', unit: 'VOTES', empty: 'No votes counted yet.\nSubmit theories the community wants to upvote.' },
};

const MEDALS = ['🥇', '🥈', '🥉'];
const MEDAL_COLORS = [COLORS.gold, COLORS.silver, COLORS.bronze];

// Row geometry (card centered at x=512, spans -360..+360).
const ROW_W = 760;
const ROW_H = 50;
const ROW_PITCH = 56;
const LIST_TOP = 196;
const COL = { rank: -352, avatar: -300, name: -262, metric: 348 };

export class LeaderboardScene extends Scene {
  private leaderboard: LeaderboardEntry[] = [];
  private currentUsername: string | null = null;
  private leaderboardType: LeaderboardType = 'xp';

  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  async create() {
    this.add.rectangle(512, 384, 1024, 768, COLORS.background);
    const gradient = this.add.rectangle(512, 384, 1024, 768, COLORS.backgroundGradient).setAlpha(0.3);
    this.tweens.add({ targets: gradient, alpha: 0.5, duration: 7000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const loadingText = this.add.text(512, 380, 'Loading leaderboard…', { fontSize: '22px', color: COLORS.text, fontStyle: 'bold' }).setOrigin(0.5);
    const spinner = this.add.circle(512, 430, 20, COLORS.accent).setStrokeStyle(3, COLORS.highlight);
    this.tweens.add({ targets: spinner, rotation: Math.PI * 2, duration: 1000, repeat: -1, ease: 'Linear' });

    try {
      const [profileResponse, leaderboardResponse] = await Promise.all([
        ApiClient.getProfile().catch(() => null),
        ApiClient.getLeaderboard(this.leaderboardType),
      ]);
      this.currentUsername = profileResponse?.user.username ?? null;
      this.leaderboard = leaderboardResponse.leaderboard;

      loadingText.destroy();
      spinner.destroy();
      gradient.destroy();
      this.buildScene();
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      loadingText.setText('Failed to load leaderboard. Please try again.');
      spinner.destroy();
      gradient.destroy();
      PremiumButton.create(this, 512, 450, 200, 50, 'RETRY', () => this.scene.restart(), { color: 0xe94560, hoverColor: 0xff6b6b });
      PremiumButton.create(this, 512, 520, 200, 50, 'BACK', () => SceneTransitions.fade(this, 'EvidenceScene'), { color: COLORS.primary, hoverColor: COLORS.secondary });
    }
  }

  private buildScene() {
    // Header.
    this.add.text(512, 40, '🏆 LEADERBOARD', {
      fontSize: '26px', color: '#ffd700', fontStyle: 'bold', fontFamily: 'Arial Black',
      shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 4, fill: true },
    }).setOrigin(0.5);
    PremiumButton.create(this, 70, 40, 96, 38, '← BACK', () => SceneTransitions.fade(this, 'EvidenceScene'), { color: 0x64748b, hoverColor: 0x94a3b8, fontSize: 15, glow: false });

    this.createTabs();

    this.add.text(512, 128, META[this.leaderboardType].subtitle, {
      fontSize: '13px', color: COLORS.textMuted, fontStyle: 'italic',
    }).setOrigin(0.5);

    if (this.leaderboard.length === 0) {
      this.renderEmptyState();
      return;
    }

    // Column header.
    const unit = META[this.leaderboardType].unit;
    this.add.text(512 + COL.name, 168, 'DETECTIVE', { fontSize: '11px', color: COLORS.textMuted, fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.add.text(512 + COL.rank, 168, '#', { fontSize: '11px', color: COLORS.textMuted, fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(512 + COL.metric, 168, unit, { fontSize: '11px', color: COLORS.textMuted, fontStyle: 'bold' }).setOrigin(1, 0.5);

    this.leaderboard.slice(0, 10).forEach((entry, i) => this.renderRow(entry, i));
  }

  private createTabs() {
    const startX = 512 - (TABS.length - 1) * 90;
    TABS.forEach((tab, i) => {
      const x = startX + i * 180;
      const active = this.leaderboardType === tab.type;
      PremiumButton.create(this, x, 90, 160, 42, `${tab.icon} ${tab.label}`, () => {
        if (this.leaderboardType !== tab.type) {
          this.leaderboardType = tab.type;
          this.scene.restart();
        }
      }, {
        color: active ? 0xe94560 : COLORS.card,
        hoverColor: active ? 0xff6b6b : COLORS.cardHover,
        textColor: active ? '#ffffff' : COLORS.textSecondary,
        fontSize: 15,
        glow: active,
      });
      if (active) {
        this.add.rectangle(x, 114, 120, 3, COLORS.accent); // active underline
      }
    });
  }

  private renderRow(entry: LeaderboardEntry, index: number) {
    const rank = index + 1;
    const isTop3 = rank <= 3;
    const isMe = entry.username === this.currentUsername;
    const y = LIST_TOP + index * ROW_PITCH;
    const accent = isMe ? 0x22c55e : isTop3 ? MEDAL_COLORS[index]! : COLORS.secondary;

    const content: GameObjects.GameObject[] = [
      // Rank / medal.
      this.add.text(COL.rank, 0, isTop3 ? MEDALS[index]! : `#${rank}`, {
        fontSize: isTop3 ? '22px' : '15px', color: isTop3 ? '#ffffff' : COLORS.textSecondary, fontStyle: 'bold',
      }).setOrigin(0.5),
      // Avatar.
      this.add.circle(COL.avatar, 0, 16, COLORS.secondary).setStrokeStyle(2, accent),
      this.add.text(COL.avatar, 0, entry.username.charAt(0).toUpperCase(), { fontSize: '14px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5),
      // Name + rank title.
      this.add.text(COL.name, -8, entry.username + (isMe ? '  (you)' : ''), {
        fontSize: '15px', color: isMe ? '#4ade80' : COLORS.text, fontStyle: 'bold',
      }).setOrigin(0, 0.5),
      this.add.text(COL.name, 11, entry.rank, { fontSize: '11px', color: COLORS.textMuted }).setOrigin(0, 0.5),
      // Metric value (right-aligned).
      this.add.text(COL.metric, 0, Math.round(entry.score).toLocaleString(), {
        fontSize: '20px', color: '#ffd700', fontStyle: 'bold', fontFamily: 'Arial Black',
      }).setOrigin(1, 0.5),
    ];

    const card = GlassCard.create(this, 512, y, ROW_W, ROW_H, content, { borderColor: accent, glow: isTop3 || isMe });
    card.setAlpha(0);
    this.tweens.add({ targets: card, alpha: 1, duration: 350, delay: index * 60, ease: 'Power2' });
  }

  private renderEmptyState() {
    const meta = META[this.leaderboardType];
    GlassCard.create(this, 512, 420, 640, 240, [
      this.add.text(0, -70, '🔍', { fontSize: '52px' }).setOrigin(0.5),
      this.add.text(0, 0, 'THE BOARD IS WIDE OPEN', {
        fontSize: '20px', color: '#ffd700', fontStyle: 'bold', fontFamily: 'Arial Black',
      }).setOrigin(0.5),
      this.add.text(0, 48, meta.empty, {
        fontSize: '15px', color: COLORS.textSecondary, align: 'center', lineSpacing: 4, wordWrap: { width: 560 },
      }).setOrigin(0.5),
    ], { borderColor: COLORS.highlight, glow: true });
  }

  shutdown() {
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
