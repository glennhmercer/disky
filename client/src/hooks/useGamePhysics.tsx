import { useCallback } from "react";
import { Disc, Vector2D, Target, Obstacle } from "../lib/gameTypes";

export const useGamePhysics = () => {
  const updateDiscs = useCallback((discs: Disc[]): Disc[] => {
    return discs.map(disc => {
      if (!disc.isActive) return disc;

      // Apply gravity
      const gravity = 0.3;
      const newVelocity = {
        x: disc.velocity.x,
        y: disc.velocity.y + gravity,
      };

      // Apply air resistance
      const airResistance = 0.99;
      newVelocity.x *= airResistance;
      newVelocity.y *= airResistance;

      // Apply spin effect for curve
      const spinEffect = disc.spin * 0.5;
      newVelocity.x += spinEffect;

      // Update position
      const newPosition = {
        x: disc.position.x + newVelocity.x,
        y: disc.position.y + newVelocity.y,
      };

      // Check bounds
      if (newPosition.y > window.innerHeight + 50 || 
          newPosition.x < -50 || 
          newPosition.x > window.innerWidth + 50) {
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
    startPos: Vector2D,
    velocity: Vector2D,
    steps: number
  ): Vector2D[] => {
    const trajectory: Vector2D[] = [];
    let pos = { ...startPos };
    let vel = { ...velocity };
    const gravity = 0.3;
    const airResistance = 0.99;
    const spinEffect = 0.2 * 0.5;

    for (let i = 0; i < steps; i++) {
      trajectory.push({ ...pos });
      
      // Apply physics
      vel.y += gravity;
      vel.x *= airResistance;
      vel.y *= airResistance;
      vel.x += spinEffect;
      
      pos.x += vel.x;
      pos.y += vel.y;
      
      // Stop if out of bounds
      if (pos.y > window.innerHeight + 50 || 
          pos.x < -50 || 
          pos.x > window.innerWidth + 50) {
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
    // Check target collisions
    for (const target of targets) {
      if (!target.isHit) {
        const distance = Math.sqrt(
          Math.pow(disc.position.x - target.position.x, 2) +
          Math.pow(disc.position.y - target.position.y, 2)
        );
        
        if (distance < disc.radius + target.radius) {
          return { targetHit: target.id, obstacleHit: false };
        }
      }
    }

    // Check obstacle collisions
    for (const obstacle of obstacles) {
      if (
        disc.position.x + disc.radius > obstacle.position.x &&
        disc.position.x - disc.radius < obstacle.position.x + obstacle.width &&
        disc.position.y + disc.radius > obstacle.position.y &&
        disc.position.y - disc.radius < obstacle.position.y + obstacle.height
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
