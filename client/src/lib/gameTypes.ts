export interface Vector2D {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  position: Vector2D;
}

export interface Target extends GameObject {
  radius: number;
  isHit: boolean;
}

export interface Obstacle extends GameObject {
  width: number;
  height: number;
}

export interface Disc extends GameObject {
  velocity: Vector2D;
  radius: number;
  spin: number;
  isActive: boolean;
}
