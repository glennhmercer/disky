// Updated physics engine for 2-axis tilt and realistic disc behavior
export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface PhysicsDisc {
  position: Vector3;
  velocity: Vector3;
  radius: number;
  isActive: boolean;
}

const BASE_SPEED = 300;
const CURVE_FACTOR = 2.0;
const DRAG = 0.05;
const GRAVITY = -400; // pixels per second^2
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

export function initializeVelocity(
  direction: Vector2,
  strength: number = 1.0,
  verticalFactor: number = 0.5
): Vector3 {
  const throwSpeed = BASE_SPEED * strength;
  const planar = scale(normalize(direction), throwSpeed);
  return { x: planar.x, y: planar.y, z: throwSpeed * verticalFactor };
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

export function updateDisc(
  disc: PhysicsDisc,
  tiltX: number,
  tiltY: number,
  deltaTime: number
): PhysicsDisc {
  if (!disc.isActive) return disc;

  const dt = deltaTime > 1 ? deltaTime / 1000 : deltaTime;

  // Apply curved force to horizontal velocity
  const curve = curvedForce(tiltX, tiltY, { x: disc.velocity.x, y: disc.velocity.y });
  const acceleration = scale(curve, dt);

  const newVelXY = add({ x: disc.velocity.x, y: disc.velocity.y }, acceleration);
  const velXYWithDrag = scale(newVelXY, 1 - DRAG * dt);

  const newVelZ = disc.velocity.z + GRAVITY * dt;

  const newPosition = {
    x: disc.position.x + velXYWithDrag.x * dt,
    y: disc.position.y + velXYWithDrag.y * dt,
    z: Math.max(0, disc.position.z + newVelZ * dt),
  };

  const finalVelocity: Vector3 = { x: velXYWithDrag.x, y: velXYWithDrag.y, z: newVelZ };

  if (magnitude(velXYWithDrag) < MIN_SPEED && newPosition.z <= 0) {
    return { ...disc, position: newPosition, velocity: finalVelocity, isActive: false };
  }

  const isOutOfBounds =
    newPosition.x < -200 ||
    newPosition.x > window.innerWidth + 200 ||
    newPosition.y < -200 ||
    newPosition.y > window.innerHeight + 200;

  const landed = newPosition.z <= 0 && finalVelocity.z <= 0;

  return {
    ...disc,
    velocity: finalVelocity,
    position: newPosition,
    isActive: !isOutOfBounds && !landed,
  };
}

// Trajectory prediction for visualization
export function predictTrajectory(
  startPos: Vector3,
  initialVelocity: Vector3,
  tiltX: number,
  tiltY: number,
  steps: number = 60,
  stepSize: number = 1/60 // 60 FPS
): Vector2[] {
  const trajectory: Vector2[] = [];

  let disc: PhysicsDisc = {
    position: startPos,
    velocity: initialVelocity,
    radius: 20,
    isActive: true
  };
  
  for (let i = 0; i < steps; i++) {
    trajectory.push({ x: disc.position.x, y: disc.position.y });
    disc = updateDisc(disc, tiltX, tiltY, stepSize);
    
    // Stop if disc goes off screen or slows down too much
    if (
      magnitude({ x: disc.velocity.x, y: disc.velocity.y }) < 0.5 ||
      disc.position.x < -200 ||
      disc.position.x > window.innerWidth + 200 ||
      disc.position.y < -200 ||
      disc.position.y > window.innerHeight + 200 ||
      (disc.position.z <= 0 && disc.velocity.z <= 0)
    )
      break;
  }
  
  return trajectory;
}

// Collision detection
export function checkCollision(
  disc: PhysicsDisc,
  obstacle: { x: number; y: number; width: number; height: number }
): boolean {
  if (disc.position.z > obstacle.height) return false;

  const closestX = Math.max(
    obstacle.x,
    Math.min(disc.position.x, obstacle.x + obstacle.width)
  );
  const closestY = Math.max(
    obstacle.y,
    Math.min(disc.position.y, obstacle.y + obstacle.height)
  );

  const distance = Math.sqrt(
    Math.pow(disc.position.x - closestX, 2) +
    Math.pow(disc.position.y - closestY, 2)
  );

  return distance < disc.radius;
}

export function checkTargetHit(
  disc: PhysicsDisc,
  target: { x: number; y: number; radius: number; z?: number }
): boolean {
  const targetZ = target.z ?? 0;
  if (Math.abs(disc.position.z - targetZ) > disc.radius) return false;

  const distance = Math.sqrt(
    Math.pow(disc.position.x - target.x, 2) +
    Math.pow(disc.position.y - target.y, 2)
  );

  return distance < disc.radius + target.radius;
}