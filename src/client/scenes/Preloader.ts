import { Scene } from 'phaser';
import { COLORS } from '../components/UIComponents';

export class Preloader extends Scene {
  private progressBar: Phaser.GameObjects.Rectangle | null = null;
  private progressText: Phaser.GameObjects.Text | null = null;
  private loadingTexts: string[] = [
    'Analyzing evidence...',
    'Interviewing witnesses...',
    'Connecting the dots...',
    'Solving the mystery...',
    'Almost there...'
  ];
  private currentTextIndex: number = 0;

  constructor() {
    super({ key: 'Preloader' });
  }

  init() {
    // Premium dark background
    this.add.rectangle(512, 384, 1024, 768, COLORS.background);

    // Logo placeholder (magnifying glass icon)
    this.createLogo();

    // Loading text
    this.createLoadingText();

    // Progress bar container
    this.add.rectangle(512, 500, 400, 8, COLORS.card)
      .setStrokeStyle(1, COLORS.secondary);

    // Progress bar with glow
    this.progressBar = this.add.rectangle(312, 500, 4, 6, COLORS.accent);

    // Progress percentage
    this.progressText = this.add.text(512, 530, '0%', {
      fontSize: '16px',
      color: COLORS.textSecondary,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Progress event listener
    this.load.on('progress', (progress: number) => {
      if (this.progressBar) {
        this.progressBar.width = 4 + 392 * progress;
      }
      if (this.progressText) {
        this.progressText.setText(`${Math.round(progress * 100)}%`);
      }

      // Update loading text based on progress
      const textIndex = Math.min(
        Math.floor(progress * this.loadingTexts.length),
        this.loadingTexts.length - 1
      );
      if (textIndex !== this.currentTextIndex) {
        this.currentTextIndex = textIndex;
        this.updateLoadingText();
      }
    });

    // Complete event
    this.load.on('complete', () => {
      this.tweens.add({
        targets: [this.progressBar, this.progressText],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          this.fadeToMainMenu();
        },
      });
    });
  }

  private createLogo() {
    // Magnifying glass icon
    const glass = this.add.circle(512, 250, 40, COLORS.accent)
      .setStrokeStyle(4, COLORS.highlight);

    const handle = this.add.rectangle(540, 280, 8, 40, COLORS.accent)
      .setAngle(45);

    // Animate logo
    this.tweens.add({
      targets: [glass, handle],
      scale: { from: 0.8, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createLoadingText() {
    const loadingText = this.add.text(512, 350, this.loadingTexts[0] || 'Loading...', {
      fontSize: '20px',
      color: COLORS.text,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    loadingText.setAlpha(0);
    this.tweens.add({
      targets: loadingText,
      alpha: 1,
      duration: 500,
    });

    loadingText.setData('loadingText', true);
  }

  private updateLoadingText() {
    const loadingText = this.children.list.find(
      (child) => child instanceof Phaser.GameObjects.Text && child.getData('loadingText')
    ) as Phaser.GameObjects.Text;

    if (loadingText) {
      this.tweens.add({
        targets: loadingText,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          loadingText.setText(this.loadingTexts[this.currentTextIndex] || 'Loading...');
          this.tweens.add({
            targets: loadingText,
            alpha: 1,
            duration: 200,
          });
        },
      });
    }
  }

  private fadeToMainMenu() {
    this.cameras.main.fade(500, 0x0f, 0x17, 0x2a);
    this.time.delayedCall(500, () => {
      this.scene.start('MainMenu');
    });
  }

  preload() {
    // Load assets - disabled as no assets exist in public/assets
    // this.load.setPath('assets');
    // this.load.image('logo', 'logo.png');
  }

  create() {
    // Scene transition handled in the load 'complete' event.
  }
}
