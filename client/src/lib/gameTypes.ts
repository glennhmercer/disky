export interface Vector2D {
  x: number;
  y: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface GameObject {
  id: string;
  position: Vector2D;
}

export interface GameObject3D {
  id: string;
  position: Vector3D;
}

export interface Target extends GameObject {
  radius: number;
  isHit: boolean;
}

export interface Obstacle extends GameObject {
  width: number;
  height: number;
}

export interface Disc extends GameObject3D {
  velocity: Vector3D;
  radius: number;
  spin: number;
  isActive: boolean;
}
