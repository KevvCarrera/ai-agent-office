import Phaser from "phaser";
import { BootScene } from "../scenes/BootScene.js";
import { OfficeScene } from "../scenes/OfficeScene.js";
import { UIScene } from "../scenes/UIScene.js";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 1200,
  height: 800,
  backgroundColor: "#070b14",
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: true
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, OfficeScene, UIScene]
};
