import React, { useRef, useEffect, useCallback, useState } from "react";
import { useGamePhysics } from "../../hooks/useGamePhysics";
import { useGameInput } from "../../hooks/useGameInput";
import { Target, Obstacle, Disc, Vector2D } from "../../lib/gameTypes";

interface GameCanvasProps {
  targets: Target[];
  obstacles: Obstacle[];
  onTargetHit: (targetId: string) => void;
  onObstacleHit: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  targets,
  obstacles,
  onTargetHit,
  onObstacleHit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [discs, setDiscs] = useState<Disc[]>([]);
  const [trajectoryPreview, setTrajectoryPreview] = useState<Vector2D[]>([]);
  const [isAiming, setIsAiming] = useState(false);
  const [aimStart, setAimStart] = useState<Vector2D>({ x: 0, y: 0 });
  const [aimEnd, setAimEnd] = useState<Vector2D>({ x: 0, y: 0 });

  const { updateDiscs, calculateTrajectory, checkCollisions } = useGamePhysics();
  const { mousePosition, isDragging, onMouseDown, onMouseMove, onMouseUp } = useGameInput();

  // Handle aiming
  useEffect(() => {
    if (isDragging) {
      setIsAiming(true);
      setAimEnd(mousePosition);
      
      // Calculate trajectory preview
      const startPos = { x: 100, y: window.innerHeight - 100 };
      const velocity = {
        x: (mousePosition.x - aimStart.x) * 0.02,
        y: (mousePosition.y - aimStart.y) * 0.02,
      };
      const preview = calculateTrajectory(startPos, velocity, 50);
      setTrajectoryPreview(preview);
    } else {
      setIsAiming(false);
      setTrajectoryPreview([]);
    }
  }, [isDragging, mousePosition, aimStart, calculateTrajectory]);

  // Handle disc throwing
  const throwDisc = useCallback((startPos: Vector2D, velocity: Vector2D) => {
    const newDisc: Disc = {
      id: Date.now().toString(),
      position: { ...startPos },
      velocity: { ...velocity },
      radius: 8,
      spin: 0.2,
      isActive: true,
    };
    setDiscs(prev => [...prev, newDisc]);
  }, []);

  // Handle mouse events
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const pos = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      setAimStart(pos);
      onMouseDown(pos);
    }
  }, [onMouseDown]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const pos = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      onMouseMove(pos);
    }
  }, [onMouseMove]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      const startPos = { x: 100, y: window.innerHeight - 100 };
      const velocity = {
        x: (aimEnd.x - aimStart.x) * 0.02,
        y: (aimEnd.y - aimStart.y) * 0.02,
      };
      throwDisc(startPos, velocity);
    }
    onMouseUp();
  }, [isDragging, aimEnd, aimStart, throwDisc, onMouseUp]);

  // Game loop
  useEffect(() => {
    const gameLoop = () => {
      // Update discs
      setDiscs(prev => {
        const updatedDiscs = updateDiscs(prev);
        
        // Check collisions
        updatedDiscs.forEach(disc => {
          if (disc.isActive) {
            const collisions = checkCollisions(disc, targets, obstacles);
            
            if (collisions.targetHit) {
              onTargetHit(collisions.targetHit);
              disc.isActive = false;
            }
            
            if (collisions.obstacleHit) {
              onObstacleHit();
              disc.isActive = false;
            }
          }
        });
        
        // Remove inactive discs after some time
        return updatedDiscs.filter(disc => disc.isActive);
      });
    };

    const interval = setInterval(gameLoop, 16); // ~60 FPS
    return () => clearInterval(interval);
  }, [updateDiscs, checkCollisions, targets, obstacles, onTargetHit, onObstacleHit]);

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#228B22");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw obstacles
    obstacles.forEach(obstacle => {
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(obstacle.position.x, obstacle.position.y, obstacle.width, obstacle.height);
      
      // Add some texture
      ctx.fillStyle = "#654321";
      ctx.fillRect(obstacle.position.x + 2, obstacle.position.y + 2, obstacle.width - 4, obstacle.height - 4);
    });

    // Draw targets
    targets.forEach(target => {
      if (!target.isHit) {
        // Draw target rings
        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(target.position.x, target.position.y, target.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(target.position.x, target.position.y, target.radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = "#FF0000";
        ctx.beginPath();
        ctx.arc(target.position.x, target.position.y, target.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw discs
    discs.forEach(disc => {
      if (disc.isActive) {
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(disc.position.x, disc.position.y, disc.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add disc shine effect
        ctx.fillStyle = "#FFFF00";
        ctx.beginPath();
        ctx.arc(disc.position.x - 2, disc.position.y - 2, disc.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw trajectory preview
    if (isAiming && trajectoryPreview.length > 0) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(trajectoryPreview[0].x, trajectoryPreview[0].y);
      trajectoryPreview.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw aiming line
    if (isAiming) {
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(100, canvas.height - 100);
      ctx.lineTo(mousePosition.x, mousePosition.y);
      ctx.stroke();
    }

    // Draw player position indicator
    ctx.fillStyle = "#000000";
    ctx.fillRect(85, canvas.height - 115, 30, 30);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(90, canvas.height - 110, 20, 20);
  }, [discs, targets, obstacles, isAiming, trajectoryPreview, mousePosition]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      render();
      requestAnimationFrame(animate);
    };
    animate();
  }, [render]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 cursor-crosshair"
      style={{ touchAction: "none" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={(e) => {
        e.preventDefault();
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            const pos = {
              x: touch.clientX - rect.left,
              y: touch.clientY - rect.top,
            };
            setAimStart(pos);
            onMouseDown(pos);
          }
        }
      }}
      onTouchMove={(e) => {
        e.preventDefault();
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            const pos = {
              x: touch.clientX - rect.left,
              y: touch.clientY - rect.top,
            };
            onMouseMove(pos);
          }
        }
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        handleMouseUp();
      }}
    />
  );
};

export default GameCanvas;
