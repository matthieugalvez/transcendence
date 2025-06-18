import type { WebSocket } from 'ws';
import { GameInstance } from './gameInstance';

// Une map central de toutes les parties en cours
const gameRooms: Map<string, GameInstance> = new Map();

/**
 * Crée une nouvelle partie et l’ajoute au store
 */
export function createGameRoom(gameId: string, difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM'): GameInstance {
    const game = new GameInstance(gameId, difficulty);
    gameRooms.set(gameId, game);
    return game;
}

/**
 * Récupère une partie existante par son gameId
 */
export function getGameRoom(gameId: string): GameInstance | undefined {
    return gameRooms.get(gameId);
}

/**
 * Supprime une partie de la map
 */
export function removeGameRoom(gameId: string): void {
    gameRooms.delete(gameId);
}

/**
 * Ajoute un joueur (WebSocket) à la partie
 */
export function addPlayerToRoom(gameId: string, ws: WebSocket): number | null {
    const game = getGameRoom(gameId);
    if (!game) return null;
    return game.addClient(ws); // 1, 2
}

export { gameRooms };