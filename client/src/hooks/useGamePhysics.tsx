import { useCallback } from 'react';
import { Disc, Target, Obstacle, Vector2D } from '../lib/gameTypes';
import { 
  PhysicsDisc, 
  Vector2, 
  updateDisc, 
  checkCollision, 
  checkTargetHit, 
  predictTrajectory,
  initializeVelocity,
  normalize
} from '../lib/physics';

export const useGamePhysics = () => {
  // Convert old Disc type to new PhysicsDisc
  const convertToPhysicsDisc = useCallback((disc: Disc): PhysicsDisc => {
    return {
      position: { x: disc.position.x, y: disc.position.y },
      velocity: { x: disc.velocity.x, y: disc.velocity.y },
      radius: disc.radius,
      isActive: disc.isActive
    };
  }, []);

  // Convert PhysicsDisc back to old Disc type
  const convertFromPhysicsDisc = useCallback((physicsDisc: PhysicsDisc, originalDisc: Disc): Disc => {
    return {
      ...originalDisc,
      position: { 
        x: physicsDisc.position.x, 
        y: physicsDisc.position.y, 
        z: originalDisc.position.z 
      },
      velocity: { 
        x: physicsDisc.velocity.x, 
        y: physicsDisc.velocity.y, 
        z: 0 
      },
      isActive: physicsDisc.isActive
    };
  }, []);

  const updateDiscs = useCallback((discs: Disc[]): Disc[] => {
    return discs.map(disc => {
      if (!disc.isActive) return disc;

      // Convert to physics disc
      const physicsDisc = convertToPhysicsDisc(disc);
      
      // Update using new physics system with tilt from spin
      const deltaTime = 1/60; // 60 FPS
      const tilt = disc.spin; // Use spin as tilt
      const updatedPhysicsDisc = updateDisc(physicsDisc, tilt, deltaTime);
      
      // Convert back to old format
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
    spin: number
  ): Vector2D[] => {
    const startPos2D: Vector2 = { x: startPos.x, y: startPos.y };
    const velocity2D: Vector2 = { x: velocity.x, y: velocity.y };
    
    const trajectory = predictTrajectory(startPos2D, velocity2D, spin, steps);
    
    // Convert to old format
    return trajectory.map(pos => ({ x: pos.x, y: pos.y }));
  }, []);

  // New function to create initial velocity based on direction and strength
  const createInitialVelocity = useCallback((direction: Vector2D, strength: number = 1.0): Vector2D => {
    const velocity2D = initializeVelocity({ x: direction.x, y: direction.y }, strength);
    return { x: velocity2D.x, y: velocity2D.y };
  }, []);

  return {
    updateDiscs,
    checkCollisions,
    calculateTrajectory,
    createInitialVelocity,
  };
};
