import Phaser from "phaser";
import { gameConfig } from "./config/gameConfig.js";

// Instanciar el juego en el navegador
export const game = new Phaser.Game(gameConfig);

export * from "./config/gameConfig.js";
export * from "./network/socketClient.js";
