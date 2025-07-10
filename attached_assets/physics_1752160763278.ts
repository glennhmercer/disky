
// Updated physics engine for 2-axis tilt and realistic disc behavior
export interface Vector2 {
  x: number;
  y: number;
}

export interface PhysicsDisc {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  isActive: boolean;
}

const BASE_SPEED = 300;
const CURVE_FACTOR = 2.0;
const DRAG = 0.05;
const MIN_SPEED = 0.5;

export function normalize(vec: Vector2): Vector2 {
  const mag = magnitude(vec);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: vec.x / mag, y: vec.y / mag };
}

export function magnitude(vec: Vector2): number {
  return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
}

export function rotate90(vec: Vector2): Vector2 {
  return { x: vec.y, y: -vec.x };
}

export function rotateNegative90(vec: Vector2): Vector2 {
  return { x: -vec.y, y: vec.x };
}

export function scale(vec: Vector2, scalar: number): Vector2 {
  return { x: vec.x * scalar, y: vec.y * scalar };
}

export function add(vec1: Vector2, vec2: Vector2): Vector2 {
  return { x: vec1.x + vec2.x, y: vec1.y + vec2.y };
}

export function initializeVelocity(direction: Vector2, strength: number = 1.0): Vector2 {
  const throwSpeed = BASE_SPEED * strength;
  return scale(normalize(direction), throwSpeed);
}

// TiltX = sideways tilt; TiltY = forward/backward tilt
export function curvedForce(tiltX: number, tiltY: number, velocity: Vector2): Vector2 {
  const speed = magnitude(velocity);
  const lateral = rotate90(velocity);
  const vertical = rotateNegative90(velocity);

  const lateralForce = scale(normalize(lateral), tiltX * speed * CURVE_FACTOR);
  const verticalForce = scale(normalize(vertical), tiltY * speed * CURVE_FACTOR);

  return add(lateralForce, verticalForce);
}

export function updateDisc(disc: PhysicsDisc, tiltX: number, tiltY: number, deltaTime: number): PhysicsDisc {
  if (!disc.isActive) return disc;

  const curve = curvedForce(tiltX, tiltY, disc.velocity);
  const acceleration = scale(curve, deltaTime);

  const newVelocity = add(disc.velocity, acceleration);
  const velocityWithDrag = scale(newVelocity, 1 - DRAG * deltaTime);
  const newPosition = add(disc.position, scale(velocityWithDrag, deltaTime));

  if (magnitude(velocityWithDrag) < MIN_SPEED) {
    return { ...disc, isActive: false };
  }

  return {
    ...disc,
    velocity: velocityWithDrag,
    position: newPosition,
  };
}
