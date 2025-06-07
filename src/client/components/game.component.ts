import { CommonComponent } from './common.component';

export class GameComponent {
  /**
   * Request a new game ID from the server
   */
  static async requestNewGameId(): Promise<string> {
    try {
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to start game');
      }

      return data.gameId;
    } catch (error) {
      console.error('Error requesting game ID:', error);
      CommonComponent.showMessage('❌ Failed to start game on server', 'error');
      throw error;
    }
  }

  /**
   * Validate player names
   */
  static validatePlayers(player1: string, player2: string): boolean {
    if (!player1.trim() || !player2.trim()) {
      CommonComponent.showMessage('❌ Please enter names for both players', 'error');
      return false;
    }

    if (player1.trim() === player2.trim()) {
      CommonComponent.showMessage('❌ Player names must be different', 'error');
      return false;
    }

    return true;
  }

  /**
   * Setup input validation for enabling start button
   */
  static setupInputValidation(
    player1Input: HTMLInputElement,
    player2Input: HTMLInputElement,
    startButton: HTMLButtonElement
  ): void {
    const validateInputs = () => {
      const player1Valid = player1Input.value.trim().length > 0;
      const player2Valid = player2Input.value.trim().length > 0;
      const differentNames = player1Input.value.trim() !== player2Input.value.trim();

      startButton.disabled = !(player1Valid && player2Valid && differentNames);
    };

    player1Input.addEventListener('input', validateInputs);
    player2Input.addEventListener('input', validateInputs);
  }
}