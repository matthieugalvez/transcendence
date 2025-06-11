import { CommonComponent } from '../components/common.component';

export class GameRender {
  /**
   * Render the game page with player inputs and controls
   */
  static renderGamePage(): {
    container: HTMLDivElement;
    player1Input: HTMLInputElement;
    player2Input: HTMLInputElement;
    startButton: HTMLButtonElement;
  } {
    document.title = 'Transcendence - Pong Game';
  //  document.body.className = 'bg-gray-100 font-sans min-h-screen flex flex-col items-center justify-center p-8';
  //  document.body.innerHTML = '';

    // Main container
    const container = document.createElement('div');
    container.className = 'bg-gray-100 min-h-screen flex flex-col items-center justify-center p-8';
    document.body.appendChild(container);

    // Title
    const title = CommonComponent.createHeading('Pong Game', 1, 'text-3xl font-bold text-gray-800 mb-8 text-center');
    container.appendChild(title);

    // Player input form
    const formContainer = CommonComponent.createContainer('bg-white rounded-lg shadow-lg p-6 mb-6');

    const player1Label = CommonComponent.createLabel('Player 1 Name:');
    const player1Input = CommonComponent.createInput('text', 'Enter Player 1 name');

    const player2Label = CommonComponent.createLabel('Player 2 Name:');
    const player2Input = CommonComponent.createInput('text', 'Enter Player 2 name');

    const startButton = CommonComponent.createButton('Start Game');
    startButton.disabled = true;
    startButton.className += ' disabled:opacity-50 disabled:cursor-not-allowed';

    formContainer.appendChild(player1Label);
    formContainer.appendChild(player1Input);
    formContainer.appendChild(player2Label);
    formContainer.appendChild(player2Input);
    formContainer.appendChild(startButton);

    container.appendChild(formContainer);

    // Instructions
    const instructions = document.createElement('div');
    instructions.className = 'text-center text-gray-600 mb-4';
    instructions.innerHTML = `
      <p class="mb-2"><strong>Controls:</strong></p>
      <p>Player 1: W (up) / S (down)</p>
      <p>Player 2: ↑ (up) / ↓ (down)</p>
    `;
    container.appendChild(instructions);

    return {
      container,
      player1Input,
      player2Input,
      startButton
    };
  }

  /**
   * Render the game canvas and controls
   */
  static renderGameCanvas(container: HTMLDivElement, player1Name: string, player2Name: string): HTMLCanvasElement {
    // Clear form content but keep container
    const formContainer = container.querySelector('.bg-white');
    if (formContainer) {
      formContainer.remove();
    }

    // Game title with player names
    const gameTitle = document.createElement('h2');
    gameTitle.textContent = `${player1Name} vs ${player2Name}`;
    gameTitle.className = 'text-2xl font-semibold text-center mb-4';
    container.appendChild(gameTitle);

    // Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    canvas.className = 'border border-gray-400 bg-black';
    container.appendChild(canvas);

    // Back button
    const backButton = CommonComponent.createButton('Back to Setup');
    backButton.className = 'mt-4 bg-gray-600 hover:bg-gray-700';
    container.appendChild(backButton);

    return canvas;
  }

  /**
   * Show game over screen
   */
  static renderGameOver(container: HTMLDivElement, winnerName: string): void {
    // Clear existing content except title
    const children = Array.from(container.children);
    children.forEach((child, index) => {
      if (index > 0) { // Keep the first child (title)
        child.remove();
      }
    });

    const winnerDiv = document.createElement('div');
    winnerDiv.className = 'text-center bg-white rounded-lg shadow-lg p-8';

    const winnerText = CommonComponent.createHeading(`🏆 ${winnerName} Wins!`, 2, 'text-3xl font-bold text-green-600 mb-4');
    const playAgainBtn = CommonComponent.createButton('Play Again');
    const homeBtn = CommonComponent.createButton('Back to Home');
    homeBtn.className = 'ml-4 bg-gray-600 hover:bg-gray-700';

    winnerDiv.appendChild(winnerText);
    winnerDiv.appendChild(playAgainBtn);
    winnerDiv.appendChild(homeBtn);

    container.appendChild(winnerDiv);
  }
}