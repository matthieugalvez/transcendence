/**
 * Store state of game
 * Receive movements from players
 * Call tick() 60 times a sec for movement update
 * Broadcast updated state to clients
 */

import type { WebSocket } from 'ws';
import type { GameState } from '../../client/pages/game/types';

interface Position { x: number; y: number; }
interface Velocity { vx: number; vy: number; }

export class GameInstance {
    private gameId: string;
    // Paddles
    private paddle1Pos: Position;
    private paddle2Pos: Position;
    private readonly paddleWidth = 10;
    private readonly paddleHeight = 100;
    private readonly paddleOffset = 20; // distance depuis le bord
    // Ball
    private ballPos: Position;
    private ballVel: Velocity;
    private readonly ballRadius = 8;
    // Score
    private score1: number;
    private score2: number;
    private readonly maxScore: number = 5;
    // List of connected websockets(players)
    private players: Set<WebSocket>;
    // ?
    private intervalHandle?: NodeJS.Timeout;
    // Parameters that won't change
    private readonly canvasWidth = 800;
    private readonly canvasHeight = 600;
    private readonly paddleSpeed = 400; // px/sec
    private readonly ballSpeed = 300;

    constructor(gameId: string) {
        this.gameId = gameId;

        this.paddle1Pos = { x: 20, y: (600 - 100) / 2};
        this.paddle2Pos = { x: 800 - 20 - 10, y: (600 - 100) / 2 };
        this.ballPos = { x: 800 / 2, y: 600 / 2 };
        this.ballVel = this.randomBallVel();

        this.score1 = 0;
        this.score2 = 0;
        this.players = new Set();

        // Main loop (tick) at 60 FPS
        this.intervalHandle = setInterval(() => this.tick(), 1000 / 60);
    }
    // to have random initial velocity of ball
    private randomBallVel(): Velocity {
        const angle = (Math.random() * 2 - 1) * (Math.PI / 4); // [-45°, +45°]
        const dir = Math.random() < 0.5 ? -1 : 1;
        return {
        vx: this.ballSpeed * Math.cos(angle) * dir,
        vy: this.ballSpeed * Math.sin(angle),
        };
    }
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
    // if no player we stop the instance    
    private destroy() {
        if (this.intervalHandle) {
        clearInterval(this.intervalHandle);
        this.intervalHandle = undefined;
        }
    }
    // when player moves
    public onClientAction(playerId: number, action: 'up' | 'down') {
        const dt = 1 / 60;
        if (playerId === 1) {
        if (action === 'up') {
            this.paddle1Pos.y = Math.max(0, this.paddle1Pos.y - this.paddleSpeed * dt);
        } else {
            this.paddle1Pos.y = Math.min(
            this.canvasHeight - this.paddleHeight,
            this.paddle1Pos.y + this.paddleSpeed * dt
            );
        }
        } else {
        if (action === 'up') {
            this.paddle2Pos.y = Math.max(0, this.paddle2Pos.y - this.paddleSpeed * dt);
        } else {
            this.paddle2Pos.y = Math.min(
            this.canvasHeight - this.paddleHeight,
            this.paddle2Pos.y + this.paddleSpeed * dt
            );
        }
        }
    }
    // 60 FPS loop
    private tick() {
        // 1) Déplacer la balle
        const dt = 1 / 60;
        this.ballPos.x += this.ballVel.vx * dt;
        this.ballPos.y += this.ballVel.vy * dt;
        // 2) Rebond haut/bas
        if (this.ballPos.y - this.ballRadius <= 0) {
            this.ballPos.y = this.ballRadius;
            this.ballVel.vy = -this.ballVel.vy;
        }
        if (this.ballPos.y + this.ballRadius >= this.canvasHeight) {
            this.ballPos.y = this.canvasHeight - this.ballRadius;
            this.ballVel.vy = -this.ballVel.vy;
        }
        // 3) Collision avec paddle1
        if (
        this.ballPos.x - this.ballRadius <= this.paddle1Pos.x + this.paddleWidth &&
        this.ballPos.x + this.ballRadius >= this.paddle1Pos.x &&
        this.ballPos.y + this.ballRadius >= this.paddle1Pos.y &&
        this.ballPos.y - this.ballRadius <= this.paddle1Pos.y + this.paddleHeight
        ) {
            this.ballPos.x = this.paddle1Pos.x + this.paddleWidth + this.ballRadius;
            this.ballVel.vx = -this.ballVel.vx;
        }
        // 4) Collision avec paddle2
        if (
        this.ballPos.x + this.ballRadius >= this.paddle2Pos.x &&
        this.ballPos.x - this.ballRadius <= this.paddle2Pos.x + this.paddleWidth &&
        this.ballPos.y + this.ballRadius >= this.paddle2Pos.y &&
        this.ballPos.y - this.ballRadius <= this.paddle2Pos.y + this.paddleHeight
        ) {
            this.ballPos.x = this.paddle2Pos.x - this.ballRadius;
            this.ballVel.vx = -this.ballVel.vx;
        }
        // 5) Sortie gauche/droite → point marqué + reset balle
        if (this.ballPos.x - this.ballRadius <= 0) {
            this.score2++;
            this.resetBall();
        } else if (this.ballPos.x + this.ballRadius >= this.canvasWidth) {
            this.score1++;
            this.resetBall();
        }
        // 6) Vérifier si on a atteint maxScore
        if (this.score1 >= this.maxScore || this.score2 >= this.maxScore) {
            const finalState = {
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
                ballVelocity: { vx: this.ballVel.vx, vy: this.ballVel.vy },
                isRunning: false,
            };
            const message = JSON.stringify(finalState);
            this.players.forEach((ws) => {
                if (ws.readyState === ws.OPEN) {
                    ws.send(message);
                }
            });
            // Arrêter la boucle tick
            if (this.intervalHandle) {
                clearInterval(this.intervalHandle);
                this.intervalHandle = undefined;
            }
            return;
        }
        // 7) Préparer l’état (quand isRunning = true) à envoyer
        const state: GameState = {
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
        ballVelocity: { vx: this.ballVel.vx, vy: this.ballVel.vy },
        isRunning: true,
        };
        // 8) Broadcast à tous les clients connectés
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
    // public to get state
    public getCurrentState(): GameState {
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
            // isRunning = false si un joueur a atteint maxScore, true sinon
            isRunning: this.score1 < this.maxScore && this.score2 < this.maxScore,
        };
    }
}
