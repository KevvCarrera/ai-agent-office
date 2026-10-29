import Phaser from "phaser";
import { gameConfig } from "./config/gameConfig.js";

// Instanciar el juego en el navegador
export const game = new Phaser.Game(gameConfig);
(window as any).__PHASER_GAME__ = game;

export * from "./config/gameConfig.js";
export * from "./network/socketClient.js";
