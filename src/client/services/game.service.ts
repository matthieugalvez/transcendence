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
  //  console.log('🏆 [GameService] Creating match with data:', {
  //    gameId,
  //    matchData: {
  //      ...matchData,
  //      // Log the data structure for debugging
  //      playerOneId_type: typeof matchData.playerOneId,
  //      playerTwoId_type: typeof matchData.playerTwoId,
  //      winnerId_type: typeof matchData.winnerId,
  //      matchType_type: typeof matchData.matchType,
  //      playerOneScore_type: typeof matchData.playerOneScore,
  //      playerTwoScore_type: typeof matchData.playerTwoScore
  //    }
  //  });

    try {
        const url = `/api/match/create/${gameId}`;
        //console.log('🏆 [GameService] Making request to:', url);

        const requestBody = JSON.stringify(matchData);
        //console.log('🏆 [GameService] Request body:', requestBody);

        const response = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: requestBody
        });

        //console.log('🏆 [GameService] Response status:', response.status);
        //console.log('🏆 [GameService] Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            console.error('🏆 [GameService] HTTP error response:', {
                status: response.status,
                statusText: response.statusText,
                url: response.url
            });

            // Try to get error details from response body
            let errorBody;
            try {
                errorBody = await response.text();
                console.error('🏆 [GameService] Error response body:', errorBody);
            } catch (bodyError) {
                console.error('🏆 [GameService] Could not read error response body:', bodyError);
            }

            throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody || 'Could not read body'}`);
        }

        const data = await response.json();
        //console.log('🏆 [GameService] Success response data:', data);
        return data; // Created match object with updated stats
    } catch (error) {
        console.error('🏆 [GameService] Error creating match:', {
            error: error.message,
            stack: error.stack,
            gameId,
            matchData
        });
        throw error;
    }
  };

  static async createTournament(payload: {
    tournamentId: string
    participants: string[]
    winnerId: string
    matches: {
      playerOneId: string
      playerTwoId: string
      playerOneScore: number
      playerTwoScore: number
      winnerId: string
    }[]
  }): Promise<any> {
    try {
      const res = await fetch('/api/tournament/create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('failed to create tournament')
      const data = await res.json();
      return data;
    } catch (e) {
      console.error('Error creating tournament: ', e);
      throw e;
    }
  }
}

