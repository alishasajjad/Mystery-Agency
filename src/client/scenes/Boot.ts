import { Scene } from 'phaser';

export class Boot extends Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create() {
    // All visuals are drawn programmatically, so there are no assets to preload.
    this.scene.start('Preloader');
  }
}
