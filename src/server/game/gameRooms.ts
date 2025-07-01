import type { WebSocket } from 'ws';
import { GameInstance } from './gameInstance.js';

// Une map central de toutes les parties en cours
const gameRooms: Map<string, GameInstance> = new Map();
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';


/**
 * Crée une nouvelle partie et l’ajoute au store
 */
export function createGameRoom(gameId: string, difficulty: Difficulty = 'MEDIUM', inviterId?: string): GameInstance {
    if (gameRooms.has(gameId)) {
        console.log(`Game room ${gameId} already exists`);
        return gameRooms.get(gameId)!;
    }

    const game = new GameInstance(gameId, difficulty, inviterId);
    gameRooms.set(gameId, game);
    console.log(`Game room created: ${gameId} (difficulty: ${difficulty}, inviter: ${inviterId})`);
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
export function removeGameRoom(gameId: string): boolean {
    const success = gameRooms.delete(gameId);
    if (success) {
        console.log(`Game room removed: ${gameId}`);
    }
    return success;
}

/**
 * Ajoute un joueur (WebSocket) à la partie
 */
export function addPlayerToRoom(gameId: string, ws: WebSocket, username: string | undefined): number | 'spectator' | 'already_joined' | null {
    const game = getGameRoom(gameId);
    if (!game) return null;
    return game.addClient(ws, username); // 1, 2, 'spectator', or 'already_joined'
}

export { gameRooms };