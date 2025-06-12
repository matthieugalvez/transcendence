export class GameService {
  static async requestNewGameId(): Promise<string> {
    const res = await fetch('/api/game/start', { method: 'POST' });
    const data = await res.json();
    if (!data.success) throw new Error('Impossible de démarrer la partie');
    return data.gameId;
  }
  // Ici ajout d'autres appels API si besoin
}

