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
