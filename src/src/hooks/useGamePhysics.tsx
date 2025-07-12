import { useCallback } from 'react';
import type { Disc, Target, Obstacle, Vector2D, Vector3D } from '../lib/gameTypes';
import {
  type PhysicsDisc,
  type Vector3,
  updateDisc,
  checkCollision,
  checkTargetHit,
  predictTrajectory,
  initializeVelocity,
} from '../lib/physics';

export const useGamePhysics = () => {
  // Convert old Disc type to new PhysicsDisc
  const convertToPhysicsDisc = useCallback((disc: Disc): PhysicsDisc => {
    return {
      position: { x: disc.position.x, y: disc.position.y, z: disc.position.z },
      velocity: { x: disc.velocity.x, y: disc.velocity.y, z: disc.velocity.z },
      radius: disc.radius,
      isActive: disc.isActive,
    };
  }, []);

  // Convert PhysicsDisc back to old Disc type
  const convertFromPhysicsDisc = useCallback(
    (physicsDisc: PhysicsDisc, originalDisc: Disc): Disc => {
      return {
        ...originalDisc,
        position: {
          x: physicsDisc.position.x,
          y: physicsDisc.position.y,
          z: physicsDisc.position.z,
        },
        velocity: {
          x: physicsDisc.velocity.x,
          y: physicsDisc.velocity.y,
          z: physicsDisc.velocity.z,
        },
        isActive: physicsDisc.isActive,
      };
    },
    []
  );

  const updateDiscs = useCallback((discs: Disc[]): Disc[] => {
    return discs.map(disc => {
      if (!disc.isActive) return disc;

      const physicsDisc = convertToPhysicsDisc(disc);
      
      // Update using 3D physics system
      const deltaTime = 1/60; // 60 FPS
      const tiltX = disc.spin; // Use spin as lateral tilt
      const tiltY = disc.tiltY || 0; // Use tiltY if available, otherwise 0
      const updatedPhysicsDisc = updateDisc(physicsDisc, tiltX, tiltY, deltaTime);
      
      return convertFromPhysicsDisc(updatedPhysicsDisc, disc);
    });
  }, [convertToPhysicsDisc, convertFromPhysicsDisc]);

  const checkCollisions = useCallback((
    disc: Disc,
    targets: Target[],
    obstacles: Obstacle[]
  ): { targetHit: string | null; obstacleHit: boolean } => {
    if (!disc.isActive) return { targetHit: null, obstacleHit: false };

    const physicsDisc = convertToPhysicsDisc(disc);

    // Check target collisions
    for (const target of targets) {
      if (!target.isHit) {
        const targetPhysics = {
          x: target.position.x,
          y: target.position.y,
          radius: target.radius
        };
        
        if (checkTargetHit(physicsDisc, targetPhysics)) {
          return { targetHit: target.id, obstacleHit: false };
        }
      }
    }

    // Check obstacle collisions
    for (const obstacle of obstacles) {
      const obstaclePhysics = {
        x: obstacle.position.x,
        y: obstacle.position.y,
        width: obstacle.width,
        height: obstacle.height
      };
      
      if (checkCollision(physicsDisc, obstaclePhysics)) {
        return { targetHit: null, obstacleHit: true };
      }
    }

    return { targetHit: null, obstacleHit: false };
  }, [convertToPhysicsDisc]);

  const calculateTrajectory = useCallback((
    startPos: { x: number; y: number; z: number },
    velocity: { x: number; y: number; z: number },
    steps: number,
    spin: number,
    tiltY: number = 0
  ): Vector2D[] => {
    const trajectory = predictTrajectory(startPos, velocity, spin, tiltY, steps);
    return trajectory.map(pos => ({ x: pos.x, y: pos.y }));
  }, []);

  // New function to create initial velocity based on direction and strength
  const createInitialVelocity = useCallback(
    (direction: Vector2D, strength: number = 1.0, vertical: number = 0.5): Vector3D => {
      return initializeVelocity({ x: direction.x, y: direction.y }, strength, vertical);
    },
    []
  );

  return {
    updateDiscs,
    checkCollisions,
    calculateTrajectory,
    createInitialVelocity,
  };
};
