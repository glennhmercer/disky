import { useCallback } from "react";
import { Disc, Vector2D, Vector3D, Target, Obstacle } from "../lib/gameTypes";

export const useGamePhysics = () => {
  const updateDiscs = useCallback((discs: Disc[]): Disc[] => {
    return discs.map(disc => {
      if (!disc.isActive) return disc;

      // Apply gravity (only affects y-axis)
      const gravity = 0.1;
      const newVelocity = {
        x: disc.velocity.x,
        y: disc.velocity.y + gravity,
        z: disc.velocity.z, // Forward motion
      };

      // Apply air resistance differently for each axis
      const airResistanceX = 0.999; // Less resistance horizontally
      const airResistanceY = 0.997; // More resistance vertically  
      const airResistanceZ = 0.9995; // Minimal resistance forward
      newVelocity.x *= airResistanceX;
      newVelocity.y *= airResistanceY;
      newVelocity.z *= airResistanceZ;

      // Enhanced spin physics for realistic curve (only affects x-axis)
      const currentSpeed = Math.sqrt(newVelocity.x * newVelocity.x + newVelocity.z * newVelocity.z);
      const spinForce = disc.spin * Math.max(0.3, currentSpeed * 0.02);
      
      // Apply spin only to horizontal movement
      newVelocity.x += spinForce;

      // Update 3D position
      const newPosition = {
        x: disc.position.x + newVelocity.x,
        y: disc.position.y + newVelocity.y,
        z: disc.position.z + newVelocity.z,
      };

      // Check bounds (convert 3D to 2D for screen bounds)
      const screenX = newPosition.x;
      const screenY = newPosition.y;
      
      if (screenY > window.innerHeight + 50 || 
          screenX < -50 || 
          screenX > window.innerWidth + 50 ||
          newPosition.z > 1000) { // Too far away
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
    spin: number = 0.2
  ): Vector2D[] => {
    const trajectory: Vector2D[] = [];
    let pos = { ...startPos };
    let vel = { ...velocity };
    const gravity = 0.1;
    const airResistanceX = 0.999;
    const airResistanceY = 0.997;
    const airResistanceZ = 0.9995;

    for (let i = 0; i < steps; i++) {
      // Convert 3D position to 2D screen coordinates with perspective
      const perspective = Math.max(0.1, 1 - (pos.z / 1000)); // Perspective scaling
      const screenX = pos.x;
      const screenY = pos.y;
      
      trajectory.push({ x: screenX, y: screenY });
      
      // Apply 3D physics matching the updateDiscs function
      vel.y += gravity;
      vel.x *= airResistanceX;
      vel.y *= airResistanceY;
      vel.z *= airResistanceZ;
      
      // Enhanced spin physics for realistic curve
      const currentSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
      const spinForce = spin * Math.max(0.3, currentSpeed * 0.02);
      
      // Apply spin only to horizontal movement
      vel.x += spinForce;
      
      pos.x += vel.x;
      pos.y += vel.y;
      pos.z += vel.z;
      
      // Stop if out of bounds
      if (pos.y > window.innerHeight + 50 || 
          pos.x < -50 || 
          pos.x > window.innerWidth + 50 ||
          pos.z > 1000) {
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
