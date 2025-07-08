import { CommonComponent } from '../components/common.component';
import { UserService } from '../services/user.service';
import { language_obj } from '../index.ts';

export class TournamentRender {
  /**
   * Render the tournament page with player inputs
   */
  static renderTournamentPage(): {
    container: HTMLDivElement;
    inputs: HTMLInputElement[];
    startButton: HTMLButtonElement;
  } {
    document.title = `${language_obj['Gamepage_tournament_button']}`;
    document.body.className = 'bg-gray-100 font-sans min-h-screen flex flex-col items-center justify-center p-8';
    document.body.innerHTML = '';

    // Main container
    const container = document.createElement('div');
    container.className = 'bg-gray-100 min-h-screen flex flex-col items-center justify-center p-8';
    document.body.appendChild(container);

    // Title
    const title = CommonComponent.createHeading(`${language_obj['Tournamentpage_name_prompt']}`, 1, 'text-3xl font-bold text-gray-800 mb-8 text-center');
    container.appendChild(title);

    // Player input form
    const formContainer = CommonComponent.createContainer('bg-white rounded-lg shadow-lg p-6 mb-6');

    // Create 4 input fields for tournament players
    const inputs: HTMLInputElement[] = [];
    for (let i = 0; i < 4; i++) {
      const label = CommonComponent.createLabel(`${language_obj['Gamepage_player']} ${i + 1} ${language_obj['Gamepage_name']}:`);
      const input = CommonComponent.createInput('text', `${language_obj['Gamepage_name_input']} ${i + 1} ${language_obj['Gamepage_name']}`);
      inputs.push(input);

      formContainer.appendChild(label);
      formContainer.appendChild(input);
    }

    const startButton = CommonComponent.createButton(`${language_obj['Tournamentpage_start']}`);
    startButton.disabled = true;
    startButton.className += ' disabled:opacity-50 disabled:cursor-not-allowed';

    formContainer.appendChild(startButton);
    container.appendChild(formContainer);

    // Tournament bracket info
    const instructions = document.createElement('div');
    instructions.className = 'text-center text-gray-600 mb-4';
    instructions.innerHTML = `
      <p class="mb-2"><strong>Tournament Format:</strong></p>
      <p>Single elimination bracket with 4 players</p>
      <p>2 semi-finals, then 1 final match</p>
    `;
    container.appendChild(instructions);

    return {
      container,
      inputs,
      startButton
    };
  }

  /**
   * Render game container for tournament match
   */
  static renderTournamentMatch(matchTitle: string): HTMLDivElement {
    document.body.innerHTML = '';
    const gameContainer = document.createElement('div');
    gameContainer.className = 'flex flex-col items-center justify-center p-4';
    document.body.appendChild(gameContainer);

    return gameContainer;
  }

  /**
   * Render tournament completion message
   */
  static renderTournamentComplete(): void {
    document.body.innerHTML = '';
    const finalMsg = document.createElement('h2');
    finalMsg.textContent = `${language_obj['Tournamentpage_finished']}`;
    finalMsg.className = 'text-3xl font-bold text-center mt-8';
    document.body.appendChild(finalMsg);
  }
}
