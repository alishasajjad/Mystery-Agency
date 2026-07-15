import { Scene, GameObjects } from 'phaser';
import { Chapter, TheoryType } from '../../shared/types';
import { THEORY_CONFIG } from '../../shared/constants';
import { ApiClient } from '../api';
import { GlassCard, PremiumButton, SceneTransitions, ToastManager, COLORS } from '../components/UIComponents';

type SubmitButton = { button: GameObjects.Rectangle; text: GameObjects.Text; container: GameObjects.Container };

// Class marker used both to style and to defensively sweep any orphaned inputs.
const TEXTAREA_CLASS = 'ma-theory-textarea';

export class TheoryScene extends Scene {
  private chapter: Chapter | null = null;
  private selectedTheoryType: TheoryType = 'suspect';
  private selectedClues: Set<string> = new Set();
  private isSubmitting: boolean = false;
  private submitButton: SubmitButton | null = null;
  private clueButtons: Map<string, GameObjects.Container> = new Map();
  private textarea: HTMLTextAreaElement | null = null;
  private charCounter: GameObjects.Text | null = null;
  private resizeBound = false;
  private isLeaving = false;

  constructor() {
    super({ key: 'TheoryScene' });
  }

  init() {
    this.selectedTheoryType = 'suspect';
    this.selectedClues = new Set();
    this.isSubmitting = false;
    this.submitButton = null;
    this.clueButtons = new Map();
    this.textarea = null;
    this.charCounter = null;
    this.resizeBound = false;
    this.isLeaving = false;
  }

  create(data: { chapter: Chapter }) {
    this.chapter = data.chapter;

    // Any textarea still in the DOM from a previous (leaked) instance is removed first.
    TheoryScene.sweepOrphanInputs();

    this.add.rectangle(512, 384, 1024, 768, COLORS.background);
    const gradient = this.add.rectangle(512, 384, 1024, 768, COLORS.backgroundGradient).setAlpha(0.3);
    this.tweens.add({ targets: gradient, alpha: 0.5, duration: 5000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const modal = GlassCard.create(this, 512, 384, 820, 660, [], { borderColor: COLORS.accent, glow: true });

    GlassCard.create(
      this,
      512,
      90,
      600,
      56,
      [this.add.text(0, 0, '💡 SUBMIT YOUR THEORY', {
        fontSize: '24px', color: '#ffd700', fontStyle: 'bold', fontFamily: 'Arial Black',
        shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 4, fill: true },
      }).setOrigin(0.5)],
      { borderColor: COLORS.accent, glow: true }
    );

    this.createTheoryTypeSelector();
    this.createTheoryInput();
    this.createEvidenceSelection();
    this.createSubmitButton();

    PremiumButton.create(
      this, 512, 690, 150, 44, 'CANCEL',
      () => this.leave('EvidenceScene'),
      { color: 0x64748b, hoverColor: 0x94a3b8, fontSize: 16, glow: false }
    );

    modal.setScale(0.9);
    modal.setAlpha(0);
    this.tweens.add({ targets: modal, scale: 1, alpha: 1, duration: 500, ease: 'Back' });

    // Keep the DOM input aligned with the canvas when the web-view resizes.
    this.scale.on('resize', this.positionTextarea, this);
    this.resizeBound = true;

    // Belt-and-suspenders DOM teardown: fire on BOTH shutdown and full game destroy,
    // in addition to the shutdown() method below. teardownDom() is idempotent.
    this.events.once('shutdown', this.teardownDom, this);
    this.events.once('destroy', this.teardownDom, this);

    // Focus for desktop convenience once the intro animation settles (mobile taps to focus).
    this.time.delayedCall(560, () => {
      if (!this.isLeaving) this.textarea?.focus();
    });
  }

  private createTheoryTypeSelector() {
    const theoryTypes: TheoryType[] = ['suspect', 'motive', 'method', 'prediction'];
    const typeLabels: Record<TheoryType, string> = {
      suspect: '🎯 SUSPECT', motive: '💭 MOTIVE', method: '🔧 METHOD', prediction: '🔮 PREDICTION',
    };
    const selectorY = 165;
    const buttonSpacing = 150;
    const startX = 512 - (buttonSpacing * 3) / 2;

    theoryTypes.forEach((type, index) => {
      const x = startX + index * buttonSpacing;
      const button = this.add.rectangle(x, selectorY, 140, 42, COLORS.card)
        .setStrokeStyle(2, COLORS.secondary)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(x, selectorY, typeLabels[type], {
        fontSize: '13px', color: COLORS.text, fontStyle: 'bold',
      }).setOrigin(0.5);

      button.on('pointerdown', () => {
        this.selectedTheoryType = type;
        this.updateTypeButtons();
        this.tweens.add({ targets: button, scale: 0.95, duration: 100, yoyo: true });
      });
      button.on('pointerover', () => { if (type !== this.selectedTheoryType) button.setFillStyle(COLORS.cardHover); });
      button.on('pointerout', () => { if (type !== this.selectedTheoryType) button.setFillStyle(COLORS.card); });

      button.setData('type', type);
      button.setData('label', label);
    });

    this.updateTypeButtons();
  }

  private updateTypeButtons() {
    this.children.list.forEach((child) => {
      if (child instanceof GameObjects.Rectangle && child.getData('type')) {
        const type = child.getData('type') as TheoryType;
        const label = child.getData('label') as GameObjects.Text;
        if (type === this.selectedTheoryType) {
          child.setStrokeStyle(3, COLORS.accent);
          child.setFillStyle(COLORS.primary);
          label.setColor('#ffd700');
        } else {
          child.setStrokeStyle(2, COLORS.secondary);
          child.setFillStyle(COLORS.card);
          label.setColor(COLORS.text);
        }
      }
    });
  }

  private createTheoryInput() {
    this.add.text(512, 220, `Your Theory (max ${THEORY_CONFIG.MAX_LENGTH} chars):`, {
      fontSize: '14px', color: COLORS.textSecondary, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Real DOM textarea overlaid on the canvas so touch devices get a native keyboard.
    // font-size:16px avoids iOS focus-zoom; opacity transition matches the panel fade-in.
    const textarea = document.createElement('textarea');
    textarea.className = TEXTAREA_CLASS;
    textarea.maxLength = THEORY_CONFIG.MAX_LENGTH;
    textarea.placeholder = 'Type your theory here...';
    textarea.setAttribute(
      'style',
      [
        'position:fixed', 'z-index:2147483000', 'box-sizing:border-box', 'resize:none',
        'padding:10px 12px', 'border-radius:8px', 'border:2px solid #ffd700',
        'background:#0f172a', 'color:#ffffff', 'font-family:Arial, sans-serif',
        'font-size:16px', 'line-height:1.4', 'outline:none',
        'opacity:0', 'transition:opacity 0.3s ease',
      ].join(';')
    );
    textarea.addEventListener('input', this.updateCharCounter);
    document.body.appendChild(textarea);
    this.textarea = textarea;
    // Fade in on the next frame so the transition applies.
    requestAnimationFrame(() => { if (this.textarea) this.textarea.style.opacity = '1'; });

    this.charCounter = this.add.text(820, 335, `0/${THEORY_CONFIG.MAX_LENGTH}`, {
      fontSize: '12px', color: COLORS.textSecondary, fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    this.positionTextarea();
  }

  /** Map the design-space input rectangle to on-screen pixels over the letterboxed canvas. */
  private positionTextarea = () => {
    if (!this.textarea) return;
    const rect = this.game.canvas.getBoundingClientRect();
    const scaleX = rect.width / 1024;
    const scaleY = rect.height / 768;
    // Design rectangle: centered at x=512, y=300, 680 wide, 96 tall.
    const w = 680 * scaleX;
    const h = 96 * scaleY;
    this.textarea.style.left = `${rect.left + 512 * scaleX - w / 2}px`;
    this.textarea.style.top = `${rect.top + 300 * scaleY - h / 2}px`;
    this.textarea.style.width = `${w}px`;
    this.textarea.style.height = `${h}px`;
  };

  private updateCharCounter = () => {
    const len = this.textarea?.value.length ?? 0;
    this.charCounter?.setText(`${len}/${THEORY_CONFIG.MAX_LENGTH}`);
  };

  private createEvidenceSelection() {
    this.add.text(512, 380, '🔍 Select Supporting Evidence:', {
      fontSize: '16px', color: COLORS.textSecondary, fontStyle: 'bold',
    }).setOrigin(0.5);

    if (!this.chapter?.clues) return;
    let clueY = 420;
    this.chapter.clues.forEach((clue, index) => {
      const chip = this.add.container(512, clueY);
      const chipBg = this.add.rectangle(0, 0, 680, 44, COLORS.card)
        .setStrokeStyle(2, COLORS.secondary)
        .setInteractive({ useHandCursor: true });
      const badge = this.add.circle(-320, 0, 17, COLORS.secondary).setStrokeStyle(2, COLORS.accent);
      const badgeText = this.add.text(-320, 0, `${index + 1}`, { fontSize: '12px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);
      const clueText = this.add.text(-285, 0, clue.description.substring(0, 72) + (clue.description.length > 72 ? '…' : ''), {
        fontSize: '13px', color: COLORS.text, wordWrap: { width: 560 },
      }).setOrigin(0, 0.5);
      const checkmark = this.add.text(315, 0, '✓', { fontSize: '20px', color: '#22c55e' }).setOrigin(0.5).setAlpha(0);

      chip.add([chipBg, badge, badgeText, clueText, checkmark]);

      chipBg.on('pointerdown', () => {
        if (this.selectedClues.has(clue.id)) {
          this.selectedClues.delete(clue.id);
          chipBg.setStrokeStyle(2, COLORS.secondary).setFillStyle(COLORS.card);
          checkmark.setAlpha(0);
        } else {
          this.selectedClues.add(clue.id);
          chipBg.setStrokeStyle(2, COLORS.accent).setFillStyle(COLORS.primary);
          checkmark.setAlpha(1);
          this.tweens.add({ targets: chip, scale: 1.02, duration: 100, yoyo: true });
        }
      });
      chipBg.on('pointerover', () => { if (!this.selectedClues.has(clue.id)) chipBg.setFillStyle(COLORS.cardHover); });
      chipBg.on('pointerout', () => { if (!this.selectedClues.has(clue.id)) chipBg.setFillStyle(COLORS.card); });

      this.clueButtons.set(clue.id, chip);
      clueY += 52;
    });
  }

  private createSubmitButton() {
    this.submitButton = PremiumButton.create(
      this, 512, 630, 220, 52, '✨ SUBMIT THEORY',
      () => void this.submitTheory(),
      { color: 0xe94560, hoverColor: 0xff6b6b, fontSize: 18, glow: true }
    );
  }

  private async submitTheory() {
    const content = this.textarea?.value.trim() ?? '';
    if (content.length === 0) {
      ToastManager.show(this, 'Please enter a theory', 'error');
      return;
    }
    if (this.selectedClues.size === 0) {
      ToastManager.show(this, 'Please select at least one piece of evidence', 'error');
      return;
    }
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    if (this.submitButton) {
      this.submitButton.button.disableInteractive();
      this.submitButton.text.setText('SUBMITTING…');
    }

    try {
      const response = await ApiClient.submitTheory({
        content,
        theory_type: this.selectedTheoryType,
        evidence_tags: Array.from(this.selectedClues),
      });
      // Remove the DOM input immediately, before starting the next scene.
      this.teardownDom();
      this.isLeaving = true;
      this.scene.start('ResultScene', {
        success: true,
        message: 'Theory submitted successfully!',
        xp_gained: response.xp_gained,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit theory';
      ToastManager.show(this, message, 'error');
      this.isSubmitting = false;
      if (this.submitButton) {
        this.submitButton.button.setInteractive({ useHandCursor: true });
        this.submitButton.text.setText('✨ SUBMIT THEORY');
      }
    }
  }

  /** Leave the scene: remove the DOM textarea up-front so it can never float over the fade. */
  private leave(target: string) {
    if (this.isLeaving) return;
    this.isLeaving = true;
    this.teardownDom();
    SceneTransitions.fade(this, target);
  }

  /** Idempotent DOM teardown: blur, detach listener, remove element, drop the reference. */
  private teardownDom = () => {
    if (this.resizeBound) {
      this.scale.off('resize', this.positionTextarea, this);
      this.resizeBound = false;
    }
    const ta = this.textarea;
    if (ta) {
      ta.removeEventListener('input', this.updateCharCounter);
      ta.blur();
      ta.remove();
      this.textarea = null;
    }
  };

  /** Remove any leftover theory inputs from the DOM (defensive against leaked instances). */
  private static sweepOrphanInputs() {
    document.querySelectorAll(`textarea.${TEXTAREA_CLASS}`).forEach((el) => el.remove());
  }

  shutdown() {
    this.teardownDom();
    this.clueButtons.forEach((chip) => chip.destroy());
    this.clueButtons.clear();
    this.submitButton = null;
    this.charCounter = null;
    this.tweens.killAll();
    this.input.keyboard?.removeAllListeners();
    this.time.removeAllEvents();
  }
}
