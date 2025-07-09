import React, { useRef, useEffect, useCallback, useState } from "react";
import { useGamePhysics } from "../../hooks/useGamePhysics";
import { Target, Obstacle, Disc, Vector2D, Vector3D } from "../../lib/gameTypes";

interface GameCanvasProps {
  targets: Target[];
  obstacles: Obstacle[];
  onTargetHit: (targetId: string) => void;
  onObstacleHit: () => void;
}

type ControlStage = "direction" | "tilt" | "thrown";

const GameCanvas: React.FC<GameCanvasProps> = ({
  targets,
  obstacles,
  onTargetHit,
  onObstacleHit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [discs, setDiscs] = useState<Disc[]>([]);
  const [controlStage, setControlStage] = useState<ControlStage>("direction");
  const [aimDirection, setAimDirection] = useState<Vector2D>({ x: 0, y: 0 });
  const [tiltAmount, setTiltAmount] = useState(0);
  const [trajectoryPreview, setTrajectoryPreview] = useState<Vector2D[]>([]);
  const [crosshairPosition, setCrosshairPosition] = useState<Vector2D>({ x: 0, y: 0 });

  const { updateDiscs, calculateTrajectory, checkCollisions } = useGamePhysics();

  // Handle mouse movement for crosshair
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const pos = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      setCrosshairPosition(pos);
      
      if (controlStage === "direction") {
        setAimDirection(pos);
      } else if (controlStage === "tilt") {
        // Calculate tilt based on horizontal mouse movement
        const centerX = rect.width / 2;
        const tilt = (pos.x - centerX) / (rect.width / 2); // -1 to 1
        setTiltAmount(Math.max(-1, Math.min(1, tilt)));
      }
    }
  }, [controlStage]);

  // Handle clicks for control stages
  const handleClick = useCallback(() => {
    if (controlStage === "direction") {
      setControlStage("tilt");
    } else if (controlStage === "tilt") {
      throwDisc();
    }
  }, [controlStage]);

  // Throw disc with direction and tilt
  const throwDisc = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const startPos = { x: canvas.width / 2, y: canvas.height - 50, z: 0 };
    
    // Calculate 3D velocity with forward (z) component
    const forwardVelocity = 35; // Much stronger forward velocity
    
    // Calculate direction based on aim point
    const directionX = (aimDirection.x - startPos.x) * 0.015;
    
    // Calculate vertical trajectory based on Y aim with diminishing returns
    const aimY = aimDirection.y;
    const targetY = canvas.height * 0.3; // Middle of upper screen
    const verticalAim = (targetY - aimY) / (canvas.height * 0.5); // Normalized -1 to 1
    const directionY = -8 + (verticalAim * 6); // Base -8, can go up to -14 or down to -2
    
    const velocity = {
      x: directionX,
      y: directionY,
      z: forwardVelocity, // Forward into the screen
    };

    console.log("Throwing disc with velocity:", velocity, "aim:", aimDirection, "verticalAim:", verticalAim, "tiltAmount:", tiltAmount, "spin:", tiltAmount * 2);

    const newDisc: Disc = {
      id: Date.now().toString(),
      position: { ...startPos },
      velocity: { ...velocity },
      radius: 8,
      spin: tiltAmount * 2, // Moderate spin multiplier for noticeable curve
      isActive: true,
    };

    setDiscs(prev => [...prev, newDisc]);
    setControlStage("thrown");
    
    // Reset for next throw after disc is gone
    setTimeout(() => {
      setControlStage("direction");
      setTiltAmount(0);
    }, 3000);
  }, [aimDirection, tiltAmount]);

  // Calculate trajectory preview
  useEffect(() => {
    if (controlStage === "tilt") {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const startPos = { x: canvas.width / 2, y: canvas.height - 50, z: 0 };
      const forwardVelocity = 35;
      
      // Calculate direction based on aim point (same as throwing)
      const directionX = (aimDirection.x - startPos.x) * 0.015;
      
      // Calculate vertical trajectory based on Y aim with diminishing returns
      const aimY = aimDirection.y;
      const targetY = canvas.height * 0.3;
      const verticalAim = (targetY - aimY) / (canvas.height * 0.5);
      const directionY = -8 + (verticalAim * 6);
      
      const velocity = {
        x: directionX,
        y: directionY,
        z: forwardVelocity,
      };

      const preview = calculateTrajectory(startPos, velocity, 100, tiltAmount * 2);
      setTrajectoryPreview(preview);
    } else {
      setTrajectoryPreview([]);
    }
  }, [controlStage, aimDirection, tiltAmount, calculateTrajectory]);

  // Game loop
  useEffect(() => {
    const gameLoop = () => {
      setDiscs(prev => {
        const updatedDiscs = updateDiscs(prev);
        
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
        
        return updatedDiscs.filter(disc => disc.isActive);
      });
    };

    const interval = setInterval(gameLoop, 16);
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

    // Draw first-person view background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#87CEEB"); // Sky blue
    gradient.addColorStop(0.7, "#90EE90"); // Light green
    gradient.addColorStop(1, "#228B22"); // Forest green
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ground line
    ctx.strokeStyle = "#654321";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height * 0.8);
    ctx.lineTo(canvas.width, canvas.height * 0.8);
    ctx.stroke();

    // Draw obstacles with 3D perspective
    obstacles.forEach(obstacle => {
      const perspective = 1 - (obstacle.position.y / canvas.height) * 0.5;
      const width = obstacle.width * perspective;
      const height = obstacle.height * perspective;
      
      // Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(obstacle.position.x + 5, obstacle.position.y + height, width, 10);
      
      // Main obstacle
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(obstacle.position.x, obstacle.position.y, width, height);
      
      // Highlight
      ctx.fillStyle = "#D2691E";
      ctx.fillRect(obstacle.position.x, obstacle.position.y, width * 0.3, height * 0.3);
    });

    // Draw targets with 3D effect
    targets.forEach(target => {
      if (!target.isHit) {
        const perspective = 1 - (target.position.y / canvas.height) * 0.3;
        const radius = target.radius * perspective;
        
        // Shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.beginPath();
        ctx.arc(target.position.x + 3, target.position.y + 3, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Target rings
        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = 3 * perspective;
        ctx.beginPath();
        ctx.arc(target.position.x, target.position.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2 * perspective;
        ctx.beginPath();
        ctx.arc(target.position.x, target.position.y, radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = "#FF0000";
        ctx.beginPath();
        ctx.arc(target.position.x, target.position.y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw discs with 3D perspective
    discs.forEach(disc => {
      if (disc.isActive) {
        // Calculate perspective based on Z-distance
        const perspective = Math.max(0.1, 1 - (disc.position.z / 1000));
        const radius = disc.radius * perspective;
        
        // Shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.beginPath();
        ctx.arc(disc.position.x + 2, disc.position.y + 2, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Disc with spin visualization
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(disc.position.x, disc.position.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Shine effect
        ctx.fillStyle = "#FFFF00";
        ctx.beginPath();
        ctx.arc(disc.position.x - 1, disc.position.y - 1, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Show spin direction with small indicator
        if (Math.abs(disc.spin) > 0.1) {
          ctx.fillStyle = disc.spin > 0 ? "#00FF00" : "#FF0000";
          const spinOffset = disc.spin > 0 ? 2 : -2;
          ctx.beginPath();
          ctx.arc(disc.position.x + spinOffset, disc.position.y, radius * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Debug: Show Z-distance
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "12px Arial";
        ctx.fillText(`Z: ${disc.position.z.toFixed(0)}`, disc.position.x + 15, disc.position.y);
      }
    });

    // Draw trajectory preview
    if (trajectoryPreview.length > 0) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
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

    // Draw crosshair
    ctx.strokeStyle = controlStage === "direction" ? "#FFFFFF" : "#FF0000";
    ctx.lineWidth = 2;
    const crossSize = 20;
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(crosshairPosition.x - crossSize, crosshairPosition.y);
    ctx.lineTo(crosshairPosition.x + crossSize, crosshairPosition.y);
    ctx.stroke();
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(crosshairPosition.x, crosshairPosition.y - crossSize);
    ctx.lineTo(crosshairPosition.x, crosshairPosition.y + crossSize);
    ctx.stroke();

    // Draw aiming line in direction stage
    if (controlStage === "direction") {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height - 50);
      ctx.lineTo(aimDirection.x, aimDirection.y);
      ctx.stroke();
    }

    // Draw tilt indicator
    if (controlStage === "tilt") {
      const centerX = canvas.width / 2;
      const indicatorY = canvas.height - 100;
      const barWidth = 200;
      const barHeight = 10;
      
      // Tilt bar background
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(centerX - barWidth / 2, indicatorY, barWidth, barHeight);
      
      // Tilt indicator
      ctx.fillStyle = tiltAmount < 0 ? "#FF4444" : "#44FF44";
      const indicatorWidth = Math.abs(tiltAmount) * (barWidth / 2);
      const indicatorX = tiltAmount < 0 ? centerX - indicatorWidth : centerX;
      ctx.fillRect(indicatorX, indicatorY, indicatorWidth, barHeight);
      
      // Center line
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, indicatorY - 5);
      ctx.lineTo(centerX, indicatorY + barHeight + 5);
      ctx.stroke();
    }

    // Draw control stage instructions
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(10, 10, 300, 60);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "16px Arial";
    
    if (controlStage === "direction") {
      ctx.fillText("STEP 1: Move mouse to aim, click to confirm", 20, 30);
      ctx.fillText("Direction set", 20, 50);
    } else if (controlStage === "tilt") {
      ctx.fillText("STEP 2: Move left/right to tilt, click to throw", 20, 30);
      ctx.fillText(`Tilt: ${tiltAmount < 0 ? 'LEFT' : 'RIGHT'} (${Math.abs(tiltAmount * 100).toFixed(0)}%)`, 20, 50);
    } else {
      ctx.fillText("Disc thrown! Wait for next shot...", 20, 30);
    }
  }, [discs, targets, obstacles, controlStage, aimDirection, tiltAmount, trajectoryPreview, crosshairPosition]);

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
      onMouseMove={handleMouseMove}
      onClick={handleClick}
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
            setCrosshairPosition(pos);
            
            if (controlStage === "direction") {
              setAimDirection(pos);
            } else if (controlStage === "tilt") {
              const centerX = rect.width / 2;
              const tilt = (pos.x - centerX) / (rect.width / 2);
              setTiltAmount(Math.max(-1, Math.min(1, tilt)));
            }
          }
        }
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        handleClick();
      }}
    />
  );
};

export default GameCanvas;