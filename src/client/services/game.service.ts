export class GameService {
  static async requestNewGameId(): Promise<string> {
    const res = await fetch('/api/game/start', { method: 'POST' });
    const data : any = await res.json();
    if (!data.success) throw new Error('Impossible de démarrer la partie');
    return data.gameId;
  }

  static async createMatch(gameId: string, matchData: {
    playerOneId: string;
    playerTwoId: string;
    winnerId: string | null;
    matchType: 'ONE_V_ONE' | 'TOURNAMENT';
    playerOneScore: number;
    playerTwoScore: number;
  }): Promise<any> {
    try {
        const response = await fetch(`/api/match/create/${gameId}`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(matchData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Created match object with updated stats
    } catch (error) {
        console.error('Error creating match:', error);
        throw error;
    }
};
  // Ici ajout d'autres appels API si besoin
}

