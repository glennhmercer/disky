import { useCallback } from "react";
import { Disc, Vector2D, Vector3D, Target, Obstacle } from "../lib/gameTypes";

export const useGamePhysics = () => {
  const updateDiscs = useCallback((discs: Disc[]): Disc[] => {
    return discs.map(disc => {
      if (!disc.isActive) return disc;

      // Real frisbee physics - starts with upward velocity, then gravity takes over
      const gravity = 0.35; // Stronger gravity for realistic arc
      const airDrag = 0.99; // Air resistance affects all movement
      
      // Create new velocity with physics
      const newVelocity = {
        x: disc.velocity.x * airDrag,
        y: disc.velocity.y + gravity, // Gravity pulls down
        z: disc.velocity.z * airDrag, // Forward motion slows down
      };

      // Apply spin effect - creates curve based on Magnus effect
      const spinStrength = Math.abs(disc.spin) * 0.8;
      const currentSpeed = Math.sqrt(newVelocity.x * newVelocity.x + newVelocity.z * newVelocity.z);
      const spinEffect = spinStrength * Math.max(0.1, currentSpeed * 0.05);
      
      // Spin creates horizontal curve (positive spin = right curve, negative = left curve)
      newVelocity.x += disc.spin > 0 ? spinEffect : -spinEffect;

      // Update position
      const newPosition = {
        x: disc.position.x + newVelocity.x,
        y: disc.position.y + newVelocity.y,
        z: disc.position.z + newVelocity.z,
      };

      // Check if disc is out of bounds or hit ground
      if (newPosition.y > window.innerHeight + 100 || 
          newPosition.x < -100 || 
          newPosition.x > window.innerWidth + 100 ||
          newPosition.z > 1500) {
        return { ...disc, isActive: false };
      }

      return {
        ...disc,
        position: newPosition,
        velocity: newVelocity,
      };
    });
  }, []);

  const calculateTrajectory = useCallback((
    startPos: Vector3D,
    velocity: Vector3D,
    steps: number,
    spin: number = 0
  ): Vector2D[] => {
    const trajectory: Vector2D[] = [];
    let pos = { ...startPos };
    let vel = { ...velocity };
    const gravity = 0.35;
    const airDrag = 0.99;

    for (let i = 0; i < steps; i++) {
      // Add current position to trajectory
      trajectory.push({ x: pos.x, y: pos.y });
      
      // Apply physics - same as updateDiscs
      vel.x *= airDrag;
      vel.y += gravity;
      vel.z *= airDrag;
      
      // Apply spin effect
      const spinStrength = Math.abs(spin) * 0.8;
      const currentSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
      const spinEffect = spinStrength * Math.max(0.1, currentSpeed * 0.05);
      vel.x += spin > 0 ? spinEffect : -spinEffect;
      
      // Update position
      pos.x += vel.x;
      pos.y += vel.y;
      pos.z += vel.z;
      
      // Stop if out of bounds
      if (pos.y > window.innerHeight + 100 || 
          pos.x < -100 || 
          pos.x > window.innerWidth + 100 ||
          pos.z > 1500) {
        break;
      }
    }

    return trajectory;
  }, []);

  const checkCollisions = useCallback((
    disc: Disc,
    targets: Target[],
    obstacles: Obstacle[]
  ): { targetHit: string | null; obstacleHit: boolean } => {
    // Check target collisions (targets are still 2D but we check against projected disc position)
    for (const target of targets) {
      if (!target.isHit) {
        const distance = Math.sqrt(
          Math.pow(disc.position.x - target.position.x, 2) +
          Math.pow(disc.position.y - target.position.y, 2)
        );
        
        // Consider perspective for collision detection
        const perspective = Math.max(0.1, 1 - (disc.position.z / 1000));
        const effectiveRadius = disc.radius * perspective;
        
        if (distance < effectiveRadius + target.radius) {
          return { targetHit: target.id, obstacleHit: false };
        }
      }
    }

    // Check obstacle collisions (obstacles are still 2D but we check against projected disc position)
    for (const obstacle of obstacles) {
      const perspective = Math.max(0.1, 1 - (disc.position.z / 1000));
      const effectiveRadius = disc.radius * perspective;
      
      if (
        disc.position.x + effectiveRadius > obstacle.position.x &&
        disc.position.x - effectiveRadius < obstacle.position.x + obstacle.width &&
        disc.position.y + effectiveRadius > obstacle.position.y &&
        disc.position.y - effectiveRadius < obstacle.position.y + obstacle.height
      ) {
        return { targetHit: null, obstacleHit: true };
      }
    }

    return { targetHit: null, obstacleHit: false };
  }, []);

  return {
    updateDiscs,
    calculateTrajectory,
    checkCollisions,
  };
};
