import type { Target, Obstacle } from "./gameTypes";

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
  
  // Throwing position is at bottom center
  const throwingX = canvasWidth / 2;
  const throwingY = canvasHeight - 50;
  
  // Target area is in the upper portion of the screen
  const targetAreaX = Math.random() * (canvasWidth * 0.6) + (canvasWidth * 0.2); // Center 60% of screen
  const targetAreaY = Math.random() * (canvasHeight * 0.4) + (canvasHeight * 0.1); // Upper 40% of screen
  
  // Position target between 35% and 85% of the distance from throwing position to target area
  const distancePercent = 0.35 + Math.random() * 0.5; // Random between 35% and 85%
  const targetX = throwingX + (targetAreaX - throwingX) * distancePercent;
  const targetY = throwingY + (targetAreaY - throwingY) * distancePercent;
  
  // Smaller targets at higher levels
  const radius = Math.max(15, 35 - (level * 2));
  
  return {
    id: `target-level-${level}`,
    position: { x: targetX, y: targetY },
    radius,
    isHit: false,
  };
};

export const generateObstacles = (count: number): Obstacle[] => {
  const obstacles: Obstacle[] = [];
  const canvasWidth = window.innerWidth || 1200;
  const canvasHeight = window.innerHeight || 800;
  
  // Throwing position is at bottom center
  const throwingX = canvasWidth / 2;
  const throwingY = canvasHeight - 50;
  
  for (let i = 0; i < count; i++) {
    // Obstacle area is in the upper portion of the screen
    const obstacleAreaX = Math.random() * (canvasWidth - 300) + 150;
    const obstacleAreaY = Math.random() * (canvasHeight * 0.6) + 50; // Upper 60% only
    
    // Position obstacle between 50% and 90% of the distance from throwing position to obstacle area
    // This ensures obstacles are never too close to the throwing spot
    const distancePercent = 0.5 + Math.random() * 0.4; // Random between 50% and 90%
    const obstacleX = throwingX + (obstacleAreaX - throwingX) * distancePercent;
    const obstacleY = throwingY + (obstacleAreaY - throwingY) * distancePercent;
    
    // Additional safety check - ensure obstacle is at least 200 pixels away from throwing position
    const distanceFromThrowingSpot = Math.sqrt(
      Math.pow(obstacleX - throwingX, 2) + Math.pow(obstacleY - throwingY, 2)
    );
    
    if (distanceFromThrowingSpot < 200) {
      // Move obstacle further away if it's too close
      const direction = Math.atan2(obstacleY - throwingY, obstacleX - throwingX);
      const newObstacleX = throwingX + Math.cos(direction) * 200;
      const newObstacleY = throwingY + Math.sin(direction) * 200;
      
      // Ensure the moved obstacle is still within bounds
      const finalObstacleX = Math.max(75, Math.min(canvasWidth - 75, newObstacleX));
      const finalObstacleY = Math.max(50, Math.min(canvasHeight - 100, newObstacleY));
      
      const width = 50 + Math.random() * 100;
      const height = 80 + Math.random() * 120;
      
      obstacles.push({
        id: `obstacle-${i}`,
        position: { x: finalObstacleX, y: finalObstacleY },
        width,
        height,
      });
    } else {
      const width = 50 + Math.random() * 100;
      const height = 80 + Math.random() * 120;
      
      obstacles.push({
        id: `obstacle-${i}`,
        position: { x: obstacleX, y: obstacleY },
        width,
        height,
      });
    }
  }
  
  return obstacles;
};
