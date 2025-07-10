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

  const dt = deltaTime > 1 ? deltaTime / 1000 : deltaTime;
  
  const curve = curvedForce(tiltX, tiltY, disc.velocity);
  const acceleration = scale(curve, dt);

  const newVelocity = add(disc.velocity, acceleration);
  const velocityWithDrag = scale(newVelocity, 1 - DRAG * dt);
  const newPosition = add(disc.position, scale(velocityWithDrag, dt));

  if (magnitude(velocityWithDrag) < MIN_SPEED) {
    return { ...disc, isActive: false };
  }

  // Check bounds - deactivate if disc goes too far off screen
  const isOutOfBounds = 
    newPosition.x < -200 || 
    newPosition.x > window.innerWidth + 200 ||
    newPosition.y < -200 || 
    newPosition.y > window.innerHeight + 200;

  return {
    ...disc,
    velocity: velocityWithDrag,
    position: newPosition,
    isActive: !isOutOfBounds,
  };
}

// Trajectory prediction for visualization
export function predictTrajectory(
  startPos: Vector2,
  initialVelocity: Vector2,
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
    trajectory.push({ ...disc.position });
    disc = updateDisc(disc, tiltX, tiltY, stepSize);
    
    // Stop if disc goes off screen or slows down too much
    if (magnitude(disc.velocity) < 0.5 || 
        disc.position.x < -200 || disc.position.x > window.innerWidth + 200 ||
        disc.position.y < -200 || disc.position.y > window.innerHeight + 200) break;
  }
  
  return trajectory;
}

// Collision detection
export function checkCollision(disc: PhysicsDisc, obstacle: { x: number; y: number; width: number; height: number }): boolean {
  const closestX = Math.max(obstacle.x, Math.min(disc.position.x, obstacle.x + obstacle.width));
  const closestY = Math.max(obstacle.y, Math.min(disc.position.y, obstacle.y + obstacle.height));
  
  const distance = Math.sqrt(
    Math.pow(disc.position.x - closestX, 2) + 
    Math.pow(disc.position.y - closestY, 2)
  );
  
  return distance < disc.radius;
}

export function checkTargetHit(disc: PhysicsDisc, target: { x: number; y: number; radius: number }): boolean {
  const distance = Math.sqrt(
    Math.pow(disc.position.x - target.x, 2) + 
    Math.pow(disc.position.y - target.y, 2)
  );
  
  return distance < (disc.radius + target.radius);
}