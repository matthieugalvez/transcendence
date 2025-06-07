import type { WebSocket } from 'ws';
import type { GameState } from '../../client/pages/game/types';

interface Position { x: number; y: number; }
interface Velocity { vx: number; vy: number; }

/**
 * Store state of game
 * Receive movements from players
 * Call tick() 60 times a sec for movement update
 * Broadcast updated state to clients
 */
export class GameInstance {
    private gameId: string;
    // Paddles
    private paddle1Pos: Position;
    private paddle2Pos: Position;
    private readonly paddleWidth = 10;
    private readonly paddleHeight = 100;
    // Ball
    private ballPos: Position;
    private ballVel: Velocity;
    private readonly ballRadius = 8;
    // Score
    private score1: number = 0;
    private score2: number = 0;
    private readonly maxScore: number = 5;
    // List of connected websockets(players)
    private players: Set<WebSocket> = new Set();
    // Tick interval
    private intervalHandle?: NodeJS.Timeout;
    // Parameters that won't change
    private readonly canvasWidth = 800;
    private readonly canvasHeight = 600;
    private readonly paddleSpeed = 400; // px/sec
    private readonly ballSpeed = 300; // px/sec

    constructor(gameId: string) {
        this.gameId = gameId;
        // initial pos of paddles
        this.paddle1Pos = { x: 20, y: (this.canvasHeight - this.paddleHeight) / 2};
        this.paddle2Pos = { x: this.canvasWidth - 20 - this.paddleWidth, y: (this.canvasHeight - this.paddleHeight) / 2 };
        this.ballPos = { x: this.canvasWidth / 2, y: this.canvasHeight / 2 };
        this.ballVel = this.randomBallVel();
        // Main loop (tick) at 60 FPS
        this.intervalHandle = setInterval(() => this.tick(), 1000 / 60);
    }

    /** ---------- PUBLIC METHODS ----------- */
    // Add player (websocket) to this instance
    public addPlayer(ws: WebSocket) {
        this.players.add(ws);
        ws.on('close', () => {
            this.players.delete(ws);
            if (this.players.size === 0) {
                this.destroy();
            }
        });
    }
    // public to get state
    public getCurrentState(): GameState {
        return this.buildState(true);
    }
    // when player moves
    public onClientAction(playerId: number, action: 'up' | 'down') {
        const dt = 1 / 60;
        if (playerId === 1) {
            this.movePaddle(this.paddle1Pos, action, dt);
        } else {
            this.movePaddle(this.paddle2Pos, action, dt);
        }
    }

    /** ----------- PRIVATE METHODS ------------ */
    // to have random initial velocity of ball
    private randomBallVel(): Velocity {
        const angle = (Math.random() * 2 - 1) * (Math.PI / 4); // [-45°, +45°]
        const dir = Math.random() < 0.5 ? -1 : 1;
        return {
            vx: this.ballSpeed * Math.cos(angle) * dir,
            vy: this.ballSpeed * Math.sin(angle),
        };
    }
    // if no player we stop the instance    
    private destroy() {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = undefined;
        }
    }
    // move paddle up or down
    private movePaddle(paddlePos: Position, action: 'up' | 'down', dt: number) {
        if (action === 'up') {
            paddlePos.y = Math.max(0, paddlePos.y - this.paddleSpeed * dt);
        } else {
            paddlePos.y = Math.min(
                this.canvasHeight - this.paddleHeight,
                paddlePos.y + this.paddleSpeed * dt
            );
        }
    }
    // 60 FPS loop
    private tick() {
        this.moveBall();
        this.checkCollisions();
        this.checkScoreAndReset();
        const ended = this.checkEndOfGame();
        if (ended) {
            this.broadcastState(false);
            this.destroy();
            return;
        }
        this.broadcastState(true);
    }

    private moveBall() {
        const dt = 1 / 60;
        this.ballPos.x += this.ballVel.vx * dt;
        this.ballPos.y += this.ballVel.vy * dt;

        // Rebond sur le plafond
        if (this.ballPos.y - this.ballRadius <= 0) {
            this.ballPos.y = this.ballRadius;
            this.ballVel.vy = -this.ballVel.vy;
        }
        // Rebond sur le sol
        if (this.ballPos.y + this.ballRadius >= this.canvasHeight) {
            this.ballPos.y = this.canvasHeight - this.ballRadius;
            this.ballVel.vy = -this.ballVel.vy;
        }
    }

    private checkCollisions() {
        // Collision avec paddle1
        if (
        this.ballPos.x - this.ballRadius <= this.paddle1Pos.x + this.paddleWidth &&
        this.ballPos.x + this.ballRadius >= this.paddle1Pos.x &&
        this.ballPos.y + this.ballRadius >= this.paddle1Pos.y &&
        this.ballPos.y - this.ballRadius <= this.paddle1Pos.y + this.paddleHeight
        ) {
            this.ballPos.x = this.paddle1Pos.x + this.paddleWidth + this.ballRadius;
            this.ballVel.vx = -this.ballVel.vx;
        }
        // Collision avec paddle2
        if (
        this.ballPos.x + this.ballRadius >= this.paddle2Pos.x &&
        this.ballPos.x - this.ballRadius <= this.paddle2Pos.x + this.paddleWidth &&
        this.ballPos.y + this.ballRadius >= this.paddle2Pos.y &&
        this.ballPos.y - this.ballRadius <= this.paddle2Pos.y + this.paddleHeight
        ) {
            this.ballPos.x = this.paddle2Pos.x - this.ballRadius;
            this.ballVel.vx = -this.ballVel.vx;
        }
    }

    private checkScoreAndReset() {
        if (this.ballPos.x - this.ballRadius <= 0) {
            this.score2++;
            this.resetBall();
        } else if (this.ballPos.x + this.ballRadius >= this.canvasWidth) {
            this.score1++;
            this.resetBall();
        }
    }

    private checkEndOfGame(): boolean {
        if (this.score1 >= this.maxScore || this.score2 >= this.maxScore) {
            return true;
        }
        return false;
    }

    private buildState(isRunning: boolean): GameState {
        return {
            paddle1: {
                x: this.paddle1Pos.x,
                y: this.paddle1Pos.y,
                width: this.paddleWidth,
                height: this.paddleHeight,
            },
            paddle2: {
                x: this.paddle2Pos.x,
                y: this.paddle2Pos.y,
                width: this.paddleWidth,
                height: this.paddleHeight,
            },
            ball: {
                x: this.ballPos.x,
                y: this.ballPos.y,
                radius: this.ballRadius,
            },
            score1: this.score1,
            score2: this.score2,
            ballVelocity: {
                vx: this.ballVel.vx,
                vy: this.ballVel.vy,
            },
            isRunning,
        };
    }

    // broadcast state to all connected websockets
    private broadcastState(isRunning: boolean) {
        const state = this.buildState(isRunning);
        const message = JSON.stringify(state);
        this.players.forEach((ws) => {
        if (ws.readyState === ws.OPEN) {
            ws.send(message);
        }
        });
    }
    // place ball in center after a point and randomly change direction
    private resetBall() {
        this.ballPos = { x: this.canvasWidth / 2, y: this.canvasHeight / 2 };
        this.ballVel = this.randomBallVel();
    }
}
