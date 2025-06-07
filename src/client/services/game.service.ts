/**
 * Game API service - handles all game-related API calls
 */
export class GameService {
  /**
   * Request a new game ID from the server
   */
  static async requestNewGameId(): Promise<string> {
    try {
      const res = await fetch('/api/game/start', { method: 'POST' });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = (await res.json()) as { success: boolean; gameId: string };

      if (!data.success) {
        throw new Error('Impossible de démarrer la partie côté serveur');
      }

      return data.gameId;
    } catch (error) {
      console.error('Error requesting new game ID:', error);
      throw new Error('Failed to create new game. Please try again.');
    }
  }
}
