import { useCallback } from "react";
import { Disc, Vector2D, Target, Obstacle } from "../lib/gameTypes";

export const useGamePhysics = () => {
  const updateDiscs = useCallback((discs: Disc[]): Disc[] => {
    return discs.map(disc => {
      if (!disc.isActive) return disc;

      // Apply gravity
      const gravity = 0.25;
      const newVelocity = {
        x: disc.velocity.x,
        y: disc.velocity.y + gravity,
      };

      // Apply air resistance differently for x and y
      const airResistanceX = 0.998; // Less resistance horizontally
      const airResistanceY = 0.995; // More resistance vertically
      newVelocity.x *= airResistanceX;
      newVelocity.y *= airResistanceY;

      // Enhanced spin physics for realistic curve
      const currentSpeed = Math.sqrt(newVelocity.x * newVelocity.x + newVelocity.y * newVelocity.y);
      const spinForce = disc.spin * Math.max(0.5, currentSpeed * 0.025); // Increased spin force multiplier
      
      // Magnus effect: perpendicular force to velocity direction
      const velocityAngle = Math.atan2(newVelocity.y, newVelocity.x);
      const perpendicularAngle = velocityAngle + Math.PI / 2;
      
      // Apply stronger curve effect
      const curveMultiplier = 1.5; // Make curves more pronounced
      newVelocity.x += Math.cos(perpendicularAngle) * spinForce * curveMultiplier;
      newVelocity.y += Math.sin(perpendicularAngle) * spinForce * curveMultiplier;

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
    steps: number,
    spin: number = 0.2
  ): Vector2D[] => {
    const trajectory: Vector2D[] = [];
    let pos = { ...startPos };
    let vel = { ...velocity };
    const gravity = 0.25;
    const airResistanceX = 0.998;
    const airResistanceY = 0.995;

    for (let i = 0; i < steps; i++) {
      trajectory.push({ ...pos });
      
      // Apply physics matching the updateDiscs function
      vel.y += gravity;
      vel.x *= airResistanceX;
      vel.y *= airResistanceY;
      
      // Enhanced spin physics for realistic curve
      const currentSpeed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
      const spinForce = spin * Math.max(0.5, currentSpeed * 0.025);
      
      // Magnus effect: perpendicular force to velocity direction
      const velocityAngle = Math.atan2(vel.y, vel.x);
      const perpendicularAngle = velocityAngle + Math.PI / 2;
      
      // Apply stronger curve effect
      const curveMultiplier = 1.5;
      vel.x += Math.cos(perpendicularAngle) * spinForce * curveMultiplier;
      vel.y += Math.sin(perpendicularAngle) * spinForce * curveMultiplier;
      
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
