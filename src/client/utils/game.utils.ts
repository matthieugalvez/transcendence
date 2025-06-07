import type { GameState } from '../types/game.types';

export function startPongInContainer(
  container: HTMLDivElement,
  title: string,
  player1Name: string,
  player2Name: string,
  onGameEnd: (winnerName: string) => void,
  gameId: string
): void {
  // Clear container
  container.innerHTML = '';

  // Create game title
  const titleElement = document.createElement('h2');
  titleElement.textContent = title;
  titleElement.className = 'text-2xl font-bold text-center mb-4';
  container.appendChild(titleElement);

  // Create canvas for the game
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  canvas.className = 'border border-gray-400 bg-black mx-auto block';
  container.appendChild(canvas);

  // Score display
  const scoreDiv = document.createElement('div');
  scoreDiv.className = 'text-center mt-4 text-xl font-bold';
  scoreDiv.innerHTML = `${player1Name}: <span id="score1">0</span> - ${player2Name}: <span id="score2">0</span>`;
  container.appendChild(scoreDiv);

  // Instructions
  const instructions = document.createElement('div');
  instructions.className = 'text-center mt-2 text-sm text-gray-600';
  instructions.innerHTML = `
    <p>${player1Name}: W (up) / S (down) | ${player2Name}: ↑ (up) / ↓ (down)</p>
  `;
  container.appendChild(instructions);

  // Initialize the game
  const pongGame = new PongGame(canvas, player1Name, player2Name, onGameEnd, gameId);
  pongGame.start();
}

class PongGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ws: WebSocket | null = null;
  private gameState: GameState | null = null;
  private player1Name: string;
  private player2Name: string;
  private onGameEnd: (winnerName: string) => void;
  private gameId: string;
  private animationId: number | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    player1Name: string,
    player2Name: string,
    onGameEnd: (winnerName: string) => void,
    gameId: string
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.player1Name = player1Name;
    this.player2Name = player2Name;
    this.onGameEnd = onGameEnd;
    this.gameId = gameId;
  }

  start(): void {
    this.connectWebSocket();
    this.setupKeyboardControls();
    this.render();
  }

  private connectWebSocket(): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/game/ws/${this.gameId}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onmessage = (event) => {
      try {
        this.gameState = JSON.parse(event.data) as GameState;
        this.updateScore();

        if (!this.gameState.isRunning) {
          this.endGame();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
  }

  private setupKeyboardControls(): void {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      let playerId: number | null = null;
      let action: 'up' | 'down' | null = null;

      switch (event.key.toLowerCase()) {
        case 'w':
          playerId = 1;
          action = 'up';
          break;
        case 's':
          playerId = 1;
          action = 'down';
          break;
        case 'arrowup':
          playerId = 2;
          action = 'up';
          break;
        case 'arrowdown':
          playerId = 2;
          action = 'down';
          break;
      }

      if (playerId && action) {
        event.preventDefault();
        this.ws.send(JSON.stringify({ playerId, action }));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
  }

  private render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.gameState) {
      // Draw center line
      this.ctx.setLineDash([5, 15]);
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(this.canvas.width / 2, 0);
      this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      // Draw paddles
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(
        this.gameState.paddle1.x,
        this.gameState.paddle1.y,
        this.gameState.paddle1.width,
        this.gameState.paddle1.height
      );
      this.ctx.fillRect(
        this.gameState.paddle2.x,
        this.gameState.paddle2.y,
        this.gameState.paddle2.width,
        this.gameState.paddle2.height
      );

      // Draw ball
      this.ctx.beginPath();
      this.ctx.arc(
        this.gameState.ball.x,
        this.gameState.ball.y,
        this.gameState.ball.radius,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    } else {
      // Draw loading message
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        'Connecting to game server...',
        this.canvas.width / 2,
        this.canvas.height / 2
      );
    }

    this.animationId = requestAnimationFrame(() => this.render());
  }

  private updateScore(): void {
    if (this.gameState) {
      const score1Element = document.getElementById('score1');
      const score2Element = document.getElementById('score2');

      if (score1Element) score1Element.textContent = this.gameState.score1.toString();
      if (score2Element) score2Element.textContent = this.gameState.score2.toString();
    }
  }

  private endGame(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.ws) {
      this.ws.close();
    }

    if (this.gameState) {
      const winner = this.gameState.score1 > this.gameState.score2 ? this.player1Name : this.player2Name;
      this.onGameEnd(winner);
    }
  }
}