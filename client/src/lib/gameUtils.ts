import { Target, Obstacle } from "./gameTypes";

export const generateTargets = (count: number): Target[] => {
  const targets: Target[] = [];
  const canvasWidth = window.innerWidth || 1200;
  const canvasHeight = window.innerHeight || 800;
  
  for (let i = 0; i < count; i++) {
    // Pre-calculate random values to avoid Math.random() in render
    const x = Math.random() * (canvasWidth - 200) + 200;
    const y = Math.random() * (canvasHeight - 200) + 100;
    const radius = 25 + Math.random() * 15;
    
    targets.push({
      id: `target-${i}`,
      position: { x, y },
      radius,
      isHit: false,
    });
  }
  
  return targets;
};

export const generateSingleTarget = (level: number): Target => {
  const canvasWidth = window.innerWidth || 1200;
  const canvasHeight = window.innerHeight || 800;
  
  // Make targets more challenging as level increases
  const minDistance = 300 + (level * 50); // Further away each level
  const maxDistance = canvasWidth - 100;
  
  // Position target randomly but ensure it's not too close
  const x = Math.random() * (maxDistance - minDistance) + minDistance;
  const y = Math.random() * (canvasHeight * 0.6) + (canvasHeight * 0.2); // Middle 60% of screen
  
  // Smaller targets at higher levels
  const radius = Math.max(20, 40 - (level * 2));
  
  return {
    id: `target-level-${level}`,
    position: { x, y },
    radius,
    isHit: false,
  };
};

export const generateObstacles = (count: number): Obstacle[] => {
  const obstacles: Obstacle[] = [];
  const canvasWidth = window.innerWidth || 1200;
  const canvasHeight = window.innerHeight || 800;
  
  for (let i = 0; i < count; i++) {
    // Pre-calculate random values to avoid Math.random() in render
    const x = Math.random() * (canvasWidth - 300) + 150;
    const y = Math.random() * (canvasHeight - 300) + 150;
    const width = 50 + Math.random() * 100;
    const height = 100 + Math.random() * 150;
    
    obstacles.push({
      id: `obstacle-${i}`,
      position: { x, y },
      width,
      height,
    });
  }
  
  return obstacles;
};
