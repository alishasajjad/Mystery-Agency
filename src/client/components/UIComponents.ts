import { Scene, GameObjects } from 'phaser';

// Design System Colors - Premium Detective Theme
export const COLORS = {
  background: 0x0a0e1a, // Deep navy black
  backgroundGradient: 0x0f172a, // Lighter navy for gradients
  card: 0x1e293b, // Slate blue glass
  cardHover: 0x334155, // Lighter slate on hover
  primary: 0x1e3a5f, // Deep detective blue
  secondary: 0x475569, // Slate gray
  accent: 0xffd700, // Gold accent
  accentGlow: 0xffb800, // Darker gold for glow
  highlight: 0x38bdf8, // Neon blue highlight
  success: 0x22c55e, // Green
  danger: 0xef4444, // Red
  warning: 0xf59e0b, // Amber
  text: '#ffffff',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  glass: 0x1e293b,
  glassBorder: 0xffd700,
  gold: 0xffd700,
  silver: 0xc0c0c0,
  bronze: 0xcd7f32,
};

// Centralized depth (z-index) system so layering is consistent and predictable.
// Content sits at the default depth; everything else is explicitly ordered above it.
export const DEPTH = {
  CONTENT: 0,
  HUD: 1000,
  MODAL: 2000,
  TOAST: 10000, // toasts must always be visible above HUD and modal overlays
} as const;

// Shared onboarding copy so the "How to Play" explanation is identical everywhere.
export const HOW_TO_PLAY_STEPS = [
  '1. Read the case briefing and examine every clue.',
  '2. Submit your theory — pick a type, write it, and tag the evidence that supports it.',
  '3. When a moderator opens the VOTING phase, the community upvotes the best theories.',
  '4. The top-voted theory becomes CANON and shapes the next chapter. Its author earns bonus XP.',
  'Earn XP for submitting, voting, and getting votes. Climb from Rookie to Agency Director.',
];

// Premium Button Component
export class PremiumButton {
  static create(
    scene: Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    onClick: () => void,
    options: {
      color?: number;
      hoverColor?: number;
      textColor?: string;
      fontSize?: number;
      glow?: boolean;
    } = {}
  ): { button: GameObjects.Rectangle; text: GameObjects.Text; container: GameObjects.Container } {
    const {
      color = COLORS.primary,
      hoverColor = COLORS.secondary,
      textColor = COLORS.text,
      fontSize = 18,
      glow = true,
    } = options;

    const container = scene.add.container(x, y);

    // Button background with rounded corners effect
    const button = scene.add.rectangle(0, 0, width, height, color)
      .setInteractive({ useHandCursor: true });

    // Enhanced glow effect
    if (glow) {
      const glow = scene.add.rectangle(0, 0, width + 15, height + 15, COLORS.accentGlow)
        .setAlpha(0.15)
        .setStrokeStyle(2, COLORS.accent);
      container.add(glow);

      // Inner glow
      const innerGlow = scene.add.rectangle(0, 0, width - 10, height - 10, COLORS.highlight)
        .setAlpha(0.05);
      container.add(innerGlow);
    }

    // Border with gold accent
    const border = scene.add.rectangle(0, 0, width, height, 0x000000, 0)
      .setStrokeStyle(3, COLORS.accent);
    container.add(border);

    // Button text with shadow
    const buttonText = scene.add.text(0, 0, text, {
      fontSize: `${fontSize}px`,
      color: textColor,
      fontStyle: 'bold',
      fontFamily: 'Arial Black',
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        fill: true,
      },
    }).setOrigin(0.5);

    container.add(button);
    container.add(buttonText);

    // Enhanced hover effects.
    // NOTE: Phaser Rectangles expose `fillColor`, not a tweenable `fillStyle`, so the
    // color must be set directly — tweening `fillStyle` is a silent no-op.
    button.on('pointerover', () => {
      button.setFillStyle(hoverColor);

      if (glow) {
        scene.tweens.add({
          targets: container.getAt(0),
          alpha: 0.3,
          scale: 1.08,
          duration: 200,
        });
        scene.tweens.add({
          targets: container.getAt(1),
          alpha: 0.1,
          duration: 200,
        });
      }

      scene.tweens.add({
        targets: buttonText,
        scale: 1.08,
        duration: 200,
      });
    });

    button.on('pointerout', () => {
      button.setFillStyle(color);

      if (glow) {
        scene.tweens.add({
          targets: container.getAt(0),
          alpha: 0.15,
          scale: 1,
          duration: 200,
        });
        scene.tweens.add({
          targets: container.getAt(1),
          alpha: 0.05,
          duration: 200,
        });
      }

      scene.tweens.add({
        targets: buttonText,
        scale: 1,
        duration: 200,
      });
    });

    // Enhanced click effect
    button.on('pointerdown', () => {
      scene.tweens.add({
        targets: button,
        scale: 0.92,
        duration: 100,
        yoyo: true,
      });
      onClick();
    });

    return { button, text: buttonText, container };
  }
}

// Glassmorphism Card Component
export class GlassCard {
  static create(
    scene: Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    content: GameObjects.GameObject[],
    options: {
      borderColor?: number;
      glow?: boolean;
      hover?: boolean;
    } = {}
  ): GameObjects.Container {
    const { borderColor = COLORS.accent, glow = true, hover = false } = options;

    const container = scene.add.container(x, y);

    // Glass background with gradient effect
    const background = scene.add.rectangle(0, 0, width, height, COLORS.card)
      .setAlpha(0.9);

    // Inner highlight for glass effect
    const innerHighlight = scene.add.rectangle(0, -height/2 + 10, width - 20, 2, COLORS.highlight)
      .setAlpha(0.3);

    // Border with gold accent
    const border = scene.add.rectangle(0, 0, width, height, 0x000000, 0)
      .setStrokeStyle(3, borderColor);

    container.add(background);
    container.add(innerHighlight);
    container.add(border);

    // Enhanced glow effect
    if (glow) {
      const glow = scene.add.rectangle(0, 0, width + 25, height + 25, borderColor)
        .setAlpha(0.12)
        .setStrokeStyle(2, borderColor);
      container.add(glow);
    }

    // Add content
    content.forEach(item => container.add(item));

    // Enhanced hover effect
    if (hover) {
      // NOTE: Container interactive disabled to prevent blocking child interaction
      // container.setInteractive({ useHandCursor: true });
      container.on('pointerover', () => {
        scene.tweens.add({
          targets: [background, border],
          alpha: 1,
          duration: 200,
        });
        scene.tweens.add({
          targets: innerHighlight,
          alpha: 0.5,
          duration: 200,
        });
        if (glow) {
          scene.tweens.add({
            targets: container.getAt(3),
            alpha: 0.2,
            scale: 1.02,
            duration: 200,
          });
        }
      });

      container.on('pointerout', () => {
        scene.tweens.add({
          targets: [background, border],
          alpha: 0.9,
          duration: 200,
        });
        scene.tweens.add({
          targets: innerHighlight,
          alpha: 0.3,
          duration: 200,
        });
        if (glow) {
          scene.tweens.add({
            targets: container.getAt(3),
            alpha: 0.12,
            scale: 1,
            duration: 200,
          });
        }
      });
    }

    return container;
  }
}

// Badge Component
export class Badge {
  static create(
    scene: Scene,
    x: number,
    y: number,
    text: string,
    type: 'gold' | 'silver' | 'bronze' | 'default' | 'canon' = 'default'
  ): GameObjects.Container {
    const colors = {
      gold: 0xffd700,
      silver: 0xc0c0c0,
      bronze: 0xcd7f32,
      default: COLORS.secondary,
      canon: 0xff6b6b,
    };

    const container = scene.add.container(x, y);

    // Badge background
    const badge = scene.add.rectangle(0, 0, 80, 24, colors[type])
      .setStrokeStyle(1, 0xffffff);

    // Badge text
    const badgeText = scene.add.text(0, 0, text, {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add(badge);
    container.add(badgeText);

    return container;
  }
}

// Toast Notification Component
export class ToastManager {
  private static toasts: GameObjects.Container[] = [];

  static show(
    scene: Scene,
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
    duration: number = 3000
  ) {
    const colors = {
      success: COLORS.success,
      error: COLORS.danger,
      info: COLORS.highlight,
    };

    // Toasts always render above HUD and modal overlays.
    const container = scene.add.container(512, 50).setDepth(DEPTH.TOAST);

    // Toast background
    const bg = scene.add.rectangle(0, 0, 400, 50, COLORS.primary)
      .setStrokeStyle(2, colors[type]);

    // Icon
    const icon = scene.add.text(-180, 0, type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Message
    const text = scene.add.text(0, 0, message, {
      fontSize: '14px',
      color: COLORS.text,
    }).setOrigin(0.5);

    container.add(bg);
    container.add(icon);
    container.add(text);

    // Animate in
    container.setAlpha(0);
    container.setY(-50);

    scene.tweens.add({
      targets: container,
      alpha: 1,
      y: 50,
      duration: 300,
      ease: 'Back',
    });

    this.toasts.push(container);

    // Auto dismiss
    scene.time.delayedCall(duration, () => {
      this.dismiss(scene, container);
    });

    return container;
  }

  static dismiss(scene: Scene, container: GameObjects.Container) {
    scene.tweens.add({
      targets: container,
      alpha: 0,
      y: -50,
      duration: 300,
      onComplete: () => {
        container.destroy();
        this.toasts = this.toasts.filter(t => t !== container);
      },
    });
  }

  static dismissAll(scene: Scene) {
    this.toasts.forEach(toast => this.dismiss(scene, toast));
  }
}

// Scene Transition Manager
export class SceneTransitions {
  static fade(scene: Scene, targetScene: string, duration: number = 500) {
    scene.cameras.main.fade(duration, 0, 0, 0);

    scene.time.delayedCall(duration, () => {
      scene.scene.start(targetScene);
    });
  }
}

// HUD Component
export class HUD {
  private static hud: GameObjects.Container | null = null;

  static create(scene: Scene): GameObjects.Container {
    // Never reuse a HUD from a previous scene — its GameObjects are already destroyed.
    if (this.hud) {
      this.hud.destroy();
      this.hud = null;
    }

    const container = scene.add.container(0, 0);

    // Background bar
    const bg = scene.add.rectangle(512, 25, 1024, 50, COLORS.primary)
      .setStrokeStyle(2, COLORS.accent);

    // Username
    const username = scene.add.text(100, 25, 'Detective', {
      fontSize: '16px',
      color: COLORS.text,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // XP
    const xp = scene.add.text(300, 25, 'XP: 0', {
      fontSize: '14px',
      color: '#00d4ff',
    }).setOrigin(0.5);

    // Rank
    const rank = scene.add.text(450, 25, 'Rookie', {
      fontSize: '14px',
      color: '#ffd700',
    }).setOrigin(0.5);

    // Chapter
    const chapter = scene.add.text(600, 25, 'Chapter 1', {
      fontSize: '14px',
      color: COLORS.textSecondary,
    }).setOrigin(0.5);

    container.add(bg);
    container.add(username);
    container.add(xp);
    container.add(rank);
    container.add(chapter);

    this.hud = container;
    container.setDepth(DEPTH.HUD);

    return container;
  }

  static update(data: { username?: string; xp?: number; rank?: string; chapter?: string }) {
    if (!this.hud) return;

    if (data.username) {
      (this.hud.getAt(1) as GameObjects.Text).setText(data.username);
    }
    if (data.xp !== undefined) {
      (this.hud.getAt(2) as GameObjects.Text).setText(`XP: ${data.xp.toLocaleString()}`);
    }
    if (data.rank) {
      (this.hud.getAt(3) as GameObjects.Text).setText(data.rank);
    }
    if (data.chapter) {
      (this.hud.getAt(4) as GameObjects.Text).setText(data.chapter);
    }
  }

  static destroy() {
    if (this.hud) {
      this.hud.destroy();
      this.hud = null;
    }
  }
}

// Reusable vertical scroll view: a masked viewport with a content container that
// supports mouse wheel, touch/trackpad drag, and ▲/▼ buttons, clamped to bounds.
// Children are added at screen-x and content-local-y (0 = top of the content).
export class ScrollView {
  readonly content: GameObjects.Container;
  private scene: Scene;
  private centerX: number;
  private topY: number;
  private width: number;
  private height: number;
  private maskGraphics: GameObjects.Graphics;
  private minY = 0;
  private scrollY = 0;
  private dragging = false;
  private startY = 0;
  private lastY = 0;
  private _wasDragged = false;
  private wheelHandler: (p: Phaser.Input.Pointer, o: unknown, dx: number, dy: number) => void;
  private downHandler: (p: Phaser.Input.Pointer) => void;
  private moveHandler: (p: Phaser.Input.Pointer) => void;
  private upHandler: () => void;
  private buttons: GameObjects.Container[] = [];

  private static readonly DRAG_THRESHOLD = 8;

  constructor(scene: Scene, centerX: number, topY: number, width: number, height: number) {
    this.scene = scene;
    this.centerX = centerX;
    this.topY = topY;
    this.width = width;
    this.height = height;

    this.content = scene.add.container(0, topY);
    this.maskGraphics = scene.make.graphics({});
    this.maskGraphics.fillRect(centerX - width / 2, topY, width, height);
    this.content.setMask(this.maskGraphics.createGeometryMask());

    this.wheelHandler = (_p, _o, _dx, dy) => this.scrollBy(-dy * 0.5);
    this.downHandler = (p) => {
      if (!this.withinViewport(p)) return;
      this.dragging = true;
      this.startY = p.y;
      this.lastY = p.y;
      this._wasDragged = false;
    };
    this.moveHandler = (p) => {
      if (!this.dragging) return;
      if (Math.abs(p.y - this.startY) > ScrollView.DRAG_THRESHOLD) this._wasDragged = true;
      this.scrollBy(p.y - this.lastY);
      this.lastY = p.y;
    };
    this.upHandler = () => { this.dragging = false; };

    scene.input.on('wheel', this.wheelHandler);
    scene.input.on('pointerdown', this.downHandler);
    scene.input.on('pointermove', this.moveHandler);
    scene.input.on('pointerup', this.upHandler);

    scene.events.once('shutdown', () => this.destroy());
  }

  add(child: GameObjects.GameObject | GameObjects.GameObject[]): void {
    this.content.add(child);
  }

  /** Set total content height; enables scrolling + buttons when it exceeds the viewport. */
  setContentHeight(height: number): void {
    this.minY = Math.min(0, this.height - height);
    if (this.minY < 0 && this.buttons.length === 0) {
      const bx = this.centerX + this.width / 2 - 4;
      this.buttons.push(
        PremiumButton.create(this.scene, bx, this.topY + 20, 38, 38, '▲', () => this.scrollBy(80), { color: COLORS.primary, hoverColor: COLORS.secondary, fontSize: 16, glow: false }).container,
        PremiumButton.create(this.scene, bx, this.topY + this.height - 20, 38, 38, '▼', () => this.scrollBy(-80), { color: COLORS.primary, hoverColor: COLORS.secondary, fontSize: 16, glow: false }).container
      );
    }
  }

  /** True if the last pointer gesture was a drag (use to suppress accidental taps). */
  get wasDragged(): boolean {
    return this._wasDragged;
  }

  private withinViewport(p: Phaser.Input.Pointer): boolean {
    return p.y >= this.topY && p.y <= this.topY + this.height;
  }

  private scrollBy(delta: number): void {
    if (this.minY >= 0) return;
    this.scrollY = Math.max(this.minY, Math.min(0, this.scrollY + delta));
    this.content.y = this.topY + this.scrollY;
  }

  destroy(): void {
    this.scene.input.off('wheel', this.wheelHandler);
    this.scene.input.off('pointerdown', this.downHandler);
    this.scene.input.off('pointermove', this.moveHandler);
    this.scene.input.off('pointerup', this.upHandler);
    this.maskGraphics.destroy();
    this.content.destroy();
    this.buttons.forEach((b) => b.destroy());
    this.buttons = [];
  }
}

// Simple centered info/dialog modal with a dim backdrop that blocks background input.
export class InfoModal {
  static show(
    scene: Scene,
    title: string,
    lines: string[],
    options: { width?: number; height?: number; buttonLabel?: string } = {}
  ): GameObjects.Container {
    const { width = 640, height = 420, buttonLabel = 'GOT IT' } = options;

    const overlay = scene.add.container(512, 384).setDepth(DEPTH.MODAL);
    const dim = scene.add.rectangle(0, 0, 1024, 768, 0x000000).setAlpha(0.75).setInteractive();
    const panel = scene.add.rectangle(0, 0, width, height, COLORS.card).setStrokeStyle(3, COLORS.accent);
    const titleText = scene.add.text(0, -height / 2 + 36, title, {
      fontSize: '24px', color: '#ffd700', fontStyle: 'bold', fontFamily: 'Arial Black',
      shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 4, fill: true },
    }).setOrigin(0.5);
    const body = scene.add.text(0, -height / 2 + 78, lines.join('\n\n'), {
      fontSize: '16px', color: COLORS.textSecondary, align: 'left', lineSpacing: 4,
      wordWrap: { width: width - 60 },
    }).setOrigin(0.5, 0);
    overlay.add([dim, panel, titleText, body]);

    const close = () => overlay.destroy();
    const btn = PremiumButton.create(scene, 0, height / 2 - 40, 180, 46, buttonLabel, close, {
      color: 0xe94560, hoverColor: 0xff6b6b, fontSize: 16,
    });
    overlay.add(btn.container);
    dim.on('pointerdown', close);

    overlay.setScale(0.92).setAlpha(0);
    scene.tweens.add({ targets: overlay, scale: 1, alpha: 1, duration: 250, ease: 'Back' });
    return overlay;
  }
}
