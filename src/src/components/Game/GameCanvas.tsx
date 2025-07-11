import React, { useRef, useEffect, useCallback, useState } from "react";
import { useGamePhysics } from "../../hooks/useGamePhysics";
import type { Target, Obstacle, Disc, Vector2D, Vector3D } from "../../lib/gameTypes";
import { normalize } from "../../lib/physics";

interface GameCanvasProps {
  targets: Target[];
  obstacles: Obstacle[];
  onTargetHit: (targetId: string) => void;
  onObstacleHit: () => void;
  currentTilt: { x: number; y: number };
  width: number;
  height: number;
}

type ControlStage = "direction" | "tilt" | "thrown";

const GameCanvas: React.FC<GameCanvasProps> = ({
  targets,
  obstacles,
  onTargetHit,
  onObstacleHit,
  currentTilt,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [discs, setDiscs] = useState<Disc[]>([]);
  const [controlStage, setControlStage] = useState<ControlStage>("direction");
  const [aimDirection, setAimDirection] = useState<Vector2D>({ x: 0, y: 0 });
  const [tiltAmount, setTiltAmount] = useState(0);
  const [trajectoryPreview, setTrajectoryPreview] = useState<Vector2D[]>([]);
  const [crosshairPosition, setCrosshairPosition] = useState<Vector2D>({ x: 0, y: 0 });
  const [tiltCenterX, setTiltCenterX] = useState(0);

  const { updateDiscs, calculateTrajectory, checkCollisions, createInitialVelocity } = useGamePhysics();

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
        // Calculate tilt based on horizontal mouse movement from first click position
        const tilt = (pos.x - tiltCenterX) / (rect.width / 2); // -1 to 1
        const clampedTilt = Math.max(-1, Math.min(1, tilt));
        console.log("Tilt updated:", clampedTilt, "mouse pos:", pos.x, "center:", tiltCenterX);
        setTiltAmount(clampedTilt);
      }
    }
  }, [controlStage]);

  // Handle clicks for control stages
  const handleClick = useCallback(() => {
    if (controlStage === "direction") {
      setTiltCenterX(aimDirection.x); // Store the first click position as tilt center
      setControlStage("tilt");
    } else if (controlStage === "tilt") {
      // Throw disc using new physics system
      const canvas = canvasRef.current;
      if (!canvas) return;

      const startPos = { x: canvas.width / 2, y: canvas.height - 50, z: 0 };
      
      // STEP 1: Define direction vector from start to aim point
      const direction = {
        x: aimDirection.x - startPos.x,
        y: aimDirection.y - startPos.y
      };
      
      // STEP 3: Initialize velocity based on direction and throw strength
      const throwStrength = 1.0; // Can be adjusted for power control
      const initialVelocity = createInitialVelocity(direction, throwStrength);
      
      const velocity = {
        x: initialVelocity.x,
        y: initialVelocity.y,
        z: 0, // Keep z for compatibility but new physics is 2D
      };

      console.log("Throwing disc with 2-AXIS PHYSICS:", velocity, "direction:", direction, "tiltX:", currentTilt.x, "tiltY:", currentTilt.y);

      const newDisc: Disc = {
        id: Date.now().toString(),
        position: { ...startPos },
        velocity: { ...velocity },
        radius: 20,
        spin: currentTilt.x, // Use joystick tiltX for lateral spin
        tiltY: currentTilt.y, // Use joystick tiltY for vertical tilt
        isActive: true,
      };

      setDiscs(prev => [...prev, newDisc]);
      setControlStage("thrown");
      
      // Reset for next throw after disc is gone
      setTimeout(() => {
        setControlStage("direction");
        setTiltAmount(0);
      }, 3000);
    }
  }, [controlStage, aimDirection, tiltAmount]);



  // Calculate trajectory preview
  useEffect(() => {
    if (controlStage === "direction") {
      // During direction phase, show straight line to cursor
      const canvas = canvasRef.current;
      if (!canvas) return;

      const startPos = { x: canvas.width / 2, y: canvas.height - 50 };
      const endPos = { x: crosshairPosition.x, y: crosshairPosition.y };
      
      // Create straight line preview
      const straightLine = [];
      const steps = 50;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        straightLine.push({
          x: startPos.x + (endPos.x - startPos.x) * t,
          y: startPos.y + (endPos.y - startPos.y) * t,
        });
      }
      setTrajectoryPreview(straightLine);
    } else if (controlStage === "tilt") {
      // During tilt phase, show curved trajectory with physics
      const canvas = canvasRef.current;
      if (!canvas) return;

      const startPos = { x: canvas.width / 2, y: canvas.height - 50, z: 0 };
      const forwardVelocity = 7.5;
      
      // Use the same direction calculation as throwing
      const direction = {
        x: aimDirection.x - startPos.x,
        y: aimDirection.y - startPos.y
      };
      
      const throwStrength = 1.0;
      const initialVelocity = createInitialVelocity(direction, throwStrength);
      
      const velocity = {
        x: initialVelocity.x,
        y: initialVelocity.y,
        z: 0,
      };

      const preview = calculateTrajectory(startPos, velocity, 100, tiltAmount);
      setTrajectoryPreview(preview);
    } else {
      setTrajectoryPreview([]);
    }
  }, [controlStage, aimDirection, tiltAmount, crosshairPosition, calculateTrajectory]);

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
        
        // Calculate tilt and rotation for realistic frisbee appearance
        const tiltAngle = disc.spin * 0.6; // Tilt based on spin
        const discFlatness = Math.max(0.15, 0.4 - Math.abs(disc.spin) * 0.3); // More spin = flatter appearance
        
        // Draw disc as a tilted ellipse
        ctx.save();
        ctx.translate(disc.position.x, disc.position.y);
        ctx.rotate(tiltAngle);
        
        // Main disc body - ellipse that gets flatter with more spin
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.ellipse(0, 0, radius, radius * discFlatness, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Outer rim
        ctx.strokeStyle = "#FFA500";
        ctx.lineWidth = Math.max(1, 3 * perspective);
        ctx.stroke();
        
        // Inner rim detail
        ctx.fillStyle = "#FF8C00";
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.4, radius * discFlatness * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Center dot
        ctx.fillStyle = "#CC6600";
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.1, radius * discFlatness * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight to show 3D effect
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.beginPath();
        ctx.ellipse(-radius * 0.2, -radius * discFlatness * 0.3, radius * 0.15, radius * discFlatness * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
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
      const indicatorY = canvas.height - 100;
      const barWidth = 200;
      const barHeight = 10;
      
      // Tilt bar background
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(tiltCenterX - barWidth / 2, indicatorY, barWidth, barHeight);
      
      // Tilt indicator
      ctx.fillStyle = tiltAmount < 0 ? "#FF4444" : "#44FF44";
      const indicatorWidth = Math.abs(tiltAmount) * (barWidth / 2);
      const indicatorX = tiltAmount < 0 ? tiltCenterX - indicatorWidth : tiltCenterX;
      ctx.fillRect(indicatorX, indicatorY, indicatorWidth, barHeight);
      
      // Center line (at tilt center, not screen center)
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tiltCenterX, indicatorY - 5);
      ctx.lineTo(tiltCenterX, indicatorY + barHeight + 5);
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

  // Resize canvas when layout size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = width;
      canvas.height = height;
    };

    resizeCanvas();
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 cursor-crosshair"
      style={{ touchAction: "none", width, height }}
      width={width}
      height={height}
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
              const tilt = (pos.x - tiltCenterX) / (rect.width / 2);
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