export interface GameState {
	paddle1: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	paddle2: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	ball: {
		x: number;
		y: number;
		radius: number;
	};
	score1: number;
	score2: number;
	ballVelocity: {
		vx: number;
		vy: number;
	};
	isRunning: boolean;
}