import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { EvidenceScene } from './scenes/EvidenceScene';
import { TheoryScene } from './scenes/TheoryScene';
import { ResultScene } from './scenes/ResultScene';
import { TheoryListScene } from './scenes/TheoryListScene';
import { CanonResultScene } from './scenes/CanonResultScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { ProfileScene } from './scenes/ProfileScene';
import { AdminScene } from './scenes/AdminScene';
import { SettingsScene } from './scenes/SettingsScene';
import * as Phaser from 'phaser';
import { AUTO, Game } from 'phaser';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    // Fixed 1024x768 design resolution, letterboxed to fit any Reddit web-view while
    // preserving the aspect ratio. FIT (not RESIZE) keeps the hardcoded design
    // coordinates centered and on-screen across desktop and mobile.
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 768,
  },
  scene: [Boot, Preloader, MainMenu, EvidenceScene, TheoryScene, ResultScene, TheoryListScene, CanonResultScene, LeaderboardScene, ProfileScene, AdminScene, SettingsScene],
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

document.addEventListener('DOMContentLoaded', () => {
  StartGame('game-container');
});
