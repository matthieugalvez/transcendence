import { Rect, PlayerId } from './types';

export class Paddle {
  private _rect: Rect;
  private speed: number;

  constructor(x: number, y: number, width: number, height: number, speed = 400) {
    this._rect = { x, y, width, height };
    this.speed = speed; // pixels par seconde
  }

  /** Getter à la position et taille (pour le rendu ou collision) */
  get rect(): Rect {
    return this._rect;
  }

  /** Déplace la raquette vers le haut (dt en secondes) */
  moveUp(dt: number, topLimit: number = 0): void {
    this._rect.y = Math.max(topLimit, this._rect.y - this.speed * dt);
  }

  /** Déplace la raquette vers le bas (dt en secondes, bottomLimit = hauteur canvas - hauteur paddle) */
  moveDown(dt: number, bottomLimit: number): void {
    this._rect.y = Math.min(bottomLimit - this._rect.height, this._rect.y + this.speed * dt);
  }
}