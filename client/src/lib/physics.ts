// New physics engine based on step-by-step redesign
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

// Physics constants
const BASE_SPEED = 8; // pixels per frame (balanced speed)
const CURVE_FACTOR = 0.3; // How much tilt affects curve (reduced for subtlety)
const DRAG = 0.003; // Very low air resistance for longer throws

// Vector math utilities
export function normalize(vec: Vector2): Vector2 {
  const mag = magnitude(vec);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: vec.x / mag, y: vec.y / mag };
}

export function magnitude(vec: Vector2): number {
  return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
}

export function rotate90(vec: Vector2): Vector2 {
  // Rotate vector 90 degrees clockwise
  return { x: vec.y, y: -vec.x };
}

export function scale(vec: Vector2, scalar: number): Vector2 {
  return { x: vec.x * scalar, y: vec.y * scalar };
}

export function add(vec1: Vector2, vec2: Vector2): Vector2 {
  return { x: vec1.x + vec2.x, y: vec1.y + vec2.y };
}

// STEP 3: Velocity Initialization
export function initializeVelocity(direction: Vector2, strength: number = 1.0): Vector2 {
  const throwSpeed = BASE_SPEED * strength;
  return scale(normalize(direction), throwSpeed);
}

// STEP 4: Curved Force Function
export function curvedForce(tilt: number, velocity: Vector2): Vector2 {
  const speed = magnitude(velocity);
  const perpendicular = rotate90(velocity);
  
  // Curve strength grows with speed and tilt
  const curveStrength = tilt * speed * CURVE_FACTOR;
  
  return scale(normalize(perpendicular), curveStrength);
}

// STEP 2: Time-Based Motion Update
export function updateDisc(disc: PhysicsDisc, tilt: number, deltaTime: number): PhysicsDisc {
  if (!disc.isActive) return disc;
  
  // Apply curved force
  const curveForce = curvedForce(tilt, disc.velocity);
  
  // Update velocity with curve force
  const newVelocity = add(disc.velocity, scale(curveForce, deltaTime));
  
  // STEP 5: Apply drag
  const draggedVelocity = scale(newVelocity, 1 - DRAG * deltaTime);
  
  // Update position
  const newPosition = add(disc.position, scale(draggedVelocity, deltaTime));
  
  // Check bounds - deactivate if disc goes too far off screen
  const isOutOfBounds = 
    newPosition.x < -200 || 
    newPosition.x > window.innerWidth + 200 ||
    newPosition.y < -200 || 
    newPosition.y > window.innerHeight + 200 ||
    magnitude(draggedVelocity) < 0.5; // Stop if moving too slowly
  
  return {
    ...disc,
    position: newPosition,
    velocity: draggedVelocity,
    isActive: !isOutOfBounds,
  };
}

// Trajectory prediction for visualization
export function predictTrajectory(
  startPos: Vector2,
  initialVelocity: Vector2,
  tilt: number,
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
    disc = updateDisc(disc, tilt, stepSize);
    
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