import React, { useState, useEffect, useRef } from "react";

interface JoystickProps {
  onTiltChange: (tiltX: number, tiltY: number) => void;
}

export const Joystick: React.FC<JoystickProps> = ({ onTiltChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) setCenter({ x: rect.width / 2, y: rect.height / 2 });
  }, []);

  const calculateTilt = (
    clientX: number,
    clientY: number,
  ): { tiltX: number; tiltY: number } | null => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const dx = clientX - rect.left - center.x;
    const dy = clientY - rect.top - center.y;
    const maxRadius = rect.width / 2;

    const tiltX = Math.max(-1, Math.min(1, dx / maxRadius));
    const tiltY = Math.max(-1, Math.min(1, dy / maxRadius));
    return { tiltX, tiltY };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
    const tilt = calculateTilt(e.clientX, e.clientY);
    if (tilt) {
      onTiltChange(tilt.tiltX, tilt.tiltY);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    e.preventDefault();
    const tilt = calculateTilt(e.clientX, e.clientY);
    if (tilt) {
      onTiltChange(tilt.tiltX, tilt.tiltY);
    }
  };

  const handlePointerUp = () => {
    setDragging(false);
    onTiltChange(0, 0);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-gray-800 bg-opacity-50 touch-none z-50 cursor-pointer"
      style={{ touchAction: "none" }}
    >
      <div className="w-full h-full border-2 border-white rounded-full pointer-events-none flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full" />
      </div>
    </div>
  );
};