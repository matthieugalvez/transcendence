/** Identifiant d’un joueur (1 ou 2 par défaut) */
export type PlayerId = 1 | 2;

/** Direction possible pour déplacer une raquette */
export type Direction = 'up' | 'down';

/** Représentation de la position et taille d’un objet rectangulaire */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** État global minimal du jeu */
export interface GameState {
  paddle1: Rect;
  paddle2: Rect;
  ball: {
    x: number;
    y: number;
    radius: number;
  };
  score1: number;
  score2: number;
  /** Vitesse actuelle de la balle */
  ballVelocity: { vx: number; vy: number };
  /** Si le jeu est en cours ou en pause */
  isRunning: boolean;
}