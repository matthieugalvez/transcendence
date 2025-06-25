import type { WebSocket } from 'ws';
import { GameInstance } from './gameInstance';

export type TournamentDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface Player {
  id: number;
  username: string;
  ws: WebSocket | null;
}

export class TournamentRoom {
  private gameId: string;
  private difficulty: TournamentDifficulty;
  private players: Player[] = [
    { id: 1, username: '', ws: null },
    { id: 2, username: '', ws: null },
    { id: 3, username: '', ws: null },
    { id: 4, username: '', ws: null },
  ];
  private currentGame: GameInstance | null = null;
  private currentMatch = 0;
  private winners: Player[] = [];
  private currentPlayers: [Player, Player] | null = null;

   broadcastPlayerList() {
    const joined = this.players.filter(p => p.ws).map(p => p.id);
    this.broadcastAll(
      JSON.stringify({ type: 'playersJoined', players: joined })
    );
  }

  constructor(gameId: string, difficulty: TournamentDifficulty) {
    this.gameId = gameId;
    this.difficulty = difficulty;
  }

  addClient(ws: WebSocket, username?: string): number | 'spectator' {
    const slot = this.players.find(p => !p.ws);
    if (slot) {
      slot.ws = ws;
      if (!slot.username) slot.username = username || `Player ${slot.id}`;
       ws.on('close', () => {
        slot.ws = null;
        this.broadcastPlayerList();
      });
      this.broadcastPlayerList();
      return slot.id;
    }
    if (this.currentGame) this.currentGame.addSpectator(ws);
    else ws.send(JSON.stringify({ type: 'playerToken', playerId: 'spectator', playerToken: '' }));
    return 'spectator';
  }

  startTournament() {
    this.currentMatch = 0;
    this.winners = [];
    this.startMatch();
  }

  private startMatch() {
    let p1: Player, p2: Player, spectators: Player[] = [];
    if (this.currentMatch === 0) {
      p1 = this.players[0];
      p2 = this.players[1];
      spectators = [this.players[2], this.players[3]];
    } else if (this.currentMatch === 1) {
      p1 = this.players[2];
      p2 = this.players[3];
      spectators = [this.players[0], this.players[1]];
    } else {
      p1 = this.winners[0];
      p2 = this.winners[1];
      spectators = this.players.filter(p => p !== p1 && p !== p2);
    }
    this.currentPlayers = [p1, p2];
    this.currentGame = new GameInstance(this.gameId, this.difficulty);
    this.currentGame.onEnd((winnerId) => this.handleMatchEnd(winnerId));
    if (p1.ws) this.currentGame.addClient(p1.ws, p1.username);
    if (p2.ws) this.currentGame.addClient(p2.ws, p2.username);
    console.log(`[Tournament][startMatch] Match ${this.currentMatch} :
      Joueurs physiques: ${p1.username} (phys: ${p1.id}) et ${p2.username} (phys: ${p2.id})
      → Sont assignés à GameInstance slots 1 et 2 (playerId: 1 et 2)
    `);

    spectators.forEach(s => { if (s.ws) this.currentGame!.addSpectator(s.ws); });
    this.broadcastAll(JSON.stringify({ type: 'matchStart', players: [p1.username, p2.username] }));
    this.broadcastPlayerList();
    // this.currentGame.start();
  }

  private handleMatchEnd(winnerId: number) {
    if (!this.currentPlayers) return;
    const winner = winnerId === 1 ? this.currentPlayers[0] : this.currentPlayers[1];
    // this.broadcastAll(JSON.stringify({ type: 'matchEnd', winner: winner.username }));
    const state = this.currentGame!.getCurrentState();
    this.broadcastAll(JSON.stringify({
      type: 'matchEnd',
      winner: winner.username,
      score1: state.score1,
      score2: state.score2,
      matchType: 'TOURNAMENT',
    }));
    if (this.currentMatch < 2) {
      this.winners.push(winner);
    }
    if (this.currentMatch < 2) {
      this.currentMatch++;
      this.startMatch();
    } else {
      this.broadcastAll(JSON.stringify({ type: 'tournamentEnd', winner: winner.username }));
    }
  }

  forwardMessage(playerSlot: number, msg: any) {
    if (!this.currentGame || !this.currentPlayers) return;
    const idx = this.currentPlayers.findIndex(p => p.id === playerSlot);
    if (idx === -1) return;
    const pid = idx + 1 as 1 | 2;
    if (msg.action === 'up' || msg.action === 'down') {
      this.currentGame.onClientAction(pid, msg.action);
    } else if (msg.action === 'pause') {
      this.currentGame.pause();
    } else if (msg.action === 'resume') {
      this.currentGame.resume();
    } else if (msg.action === 'start') {
      if (!this.currentGame.getCurrentState().isRunning) this.currentGame.start();
    } else if (msg.action === 'difficulty' && msg.difficulty) {
      this.currentGame.setDifficulty(msg.difficulty);
    }
  }

  private broadcastAll(msg: string) {
    this.players.forEach(p => { if (p.ws && p.ws.readyState === p.ws.OPEN) p.ws.send(msg); });
  }
  getConnectedPlayerIds(): number[] {
    return this.players.filter(p => p.ws).map(p => p.id);
  }
}

const tournamentRooms: Map<string, TournamentRoom> = new Map();

export function createTournamentRoom(gameId: string, diff: TournamentDifficulty): TournamentRoom {
  const room = new TournamentRoom(gameId, diff);
  tournamentRooms.set(gameId, room);
  return room;
}
export function getTournamentRoom(gameId: string): TournamentRoom | undefined {
  return tournamentRooms.get(gameId);
}
export function removeTournamentRoom(gameId: string) {
  tournamentRooms.delete(gameId);
}

export { tournamentRooms };
