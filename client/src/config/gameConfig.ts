import Phaser from "phaser";
import { BootScene } from "../scenes/BootScene.js";
import { OfficeScene } from "../scenes/OfficeScene.js";
import { UIScene } from "../scenes/UIScene.js";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 1200,
  height: 800,
  backgroundColor: "#0b0f19",
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, OfficeScene, UIScene]
};
