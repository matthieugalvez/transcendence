import { Rect } from './types';

export class Ball {
  private _x: number;
  private _y: number;
  private _radius: number;
  private _velocity: { vx: number; vy: number };

  constructor(x: number, y: number, radius: number, speed = 300) {
    this._x = x;
    this._y = y;
    this._radius = radius;
    // On initialise une vitesse de départ aléatoire, direction vers le joueur A ou B
    const angle = (Math.random() * 2 - 1) * (Math.PI / 4); // [-45°, +45°]
    const dir = Math.random() < 0.5 ? -1 : 1;
    this._velocity = {
      vx: speed * Math.cos(angle) * dir,
      vy: speed * Math.sin(angle),
    };
  }

  /** Getter à l’état de la balle */
  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get radius(): number { return this._radius; }
  get velocity(): { vx: number; vy: number } { return this._velocity; }

  /**
   * Met à jour la position de la balle d’après la vélocité et 
   * gère le rebond sur le haut/bas (limites top=0, bottom=canvasHeight)
   */
  update(dt: number, canvasHeight: number): void {
    this._x += this._velocity.vx * dt;
    this._y += this._velocity.vy * dt;

    // Rebond sur le plafond (y - radius <= 0) ou sur le sol (y + radius >= canvasHeight)
    if (this._y - this._radius <= 0) {
      this._y = this._radius;
      this._velocity.vy = -this._velocity.vy;
    }
    if (this._y + this._radius >= canvasHeight) {
      this._y = canvasHeight - this._radius;
      this._velocity.vy = -this._velocity.vy;
    }
  }

  /** Inverse la direction horizontale (rebond sur paddle) */
  bounceHorizontally(): void {
    this._velocity.vx = -this._velocity.vx;
  }

  /** Réinitialise la balle au centre */
  reset(x: number, y: number, speed = 300): void {
    this._x = x;
    this._y = y;
    const angle = (Math.random() * 2 - 1) * (Math.PI / 4);
    const dir = Math.random() < 0.5 ? -1 : 1;
    this._velocity = {
      vx: speed * Math.cos(angle) * dir,
      vy: speed * Math.sin(angle),
    };
  }
}