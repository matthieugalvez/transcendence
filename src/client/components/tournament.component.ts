import { startPongInContainer } from '../pages/game/utils';
import { GameService } from '../services/game.service';
import { TournamentRender } from '../renders/tournament.render';

export class TournamentComponent {
	/**
	 * Validate tournament player names
	 */
	static validateTournamentPlayers(playerNames: string[]): boolean {
		// Check if all names are filled
		for (const name of playerNames) {
			if (!name.trim()) {
				alert('Please enter names for all 4 players');
				return false;
			}
		}

		// Check for duplicate names
		const uniqueNames = new Set(playerNames);
		if (uniqueNames.size !== playerNames.length) {
			alert('All players must have different names');
			return false;
		}

		return true;
	}

	/**
	 * Launch the tournament with given players
	 */
	static async launchTournament(playerNames: string[]): Promise<void> {
		// Prepare matchups: semi-finals and final
		const matchups: [string, string][] = [
			[playerNames[0], playerNames[1]],
			[playerNames[2], playerNames[3]],
			['', ''], // Final match - will be filled with winners
		];

		const winners: string[] = [];

		// Function to play each match
		async function playMatch(i: number): Promise<void> {
			if (i >= matchups.length) {
				// Tournament finished
				TournamentRender.renderTournamentComplete();
				return;
			}

			// If it's the final match, fill with winners from semi-finals
			if (i === 2) {
				matchups[2][0] = winners[0];
				matchups[2][1] = winners[1];
			}

			const [leftAlias, rightAlias] = matchups[i];
			const matchTitle = `Match ${i + 1} : ${leftAlias} vs ${rightAlias}`;

			// Render match container
			const gameContainer = TournamentRender.renderTournamentMatch(matchTitle);

			try {
				// Get gameId from server
				const gameId = await GameService.requestNewGameId();

				// Display the game ID for the match
				const gameIdElement = document.createElement('div');
				gameIdElement.className = 'text-sm text-gray-600 mb-4 text-center';
				gameIdElement.textContent = `Game ID: ${gameId}`;
				gameContainer.appendChild(gameIdElement);

				// Start the match
				startPongInContainer(
					gameContainer,
					matchTitle,
					leftAlias,
					rightAlias,
					(winnerAlias: string) => {
						// Match finished, proceed to next match after delay
						setTimeout(() => {
							winners.push(winnerAlias);
							playMatch(i + 1);
						}, 4000); // Give time to see winner message
					},
					gameId
				);
			} catch (error) {
				console.error('Error starting tournament match:', error);
				const errMsg = document.createElement('p');
				errMsg.textContent = 'Erreur serveur, réessayez plus tard';
				errMsg.className = 'text-red-600';
				document.body.appendChild(errMsg);
				return;
			}
		}

		// Start tournament with first match
		await playMatch(0);
	}
}
