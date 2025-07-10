import React, { useState, useEffect, useRef } from "react";

interface JoystickProps {
  onTiltChange: (tiltX: number, tiltY: number) => void;
}

export const Joystick: React.FC<JoystickProps> = ({ onTiltChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) setCenter({ x: rect.width / 2, y: rect.height / 2 });
  }, []);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    const touch = "touches" in e ? e.touches[0] : e;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dx = touch.clientX - rect.left - center.x;
    const dy = touch.clientY - rect.top - center.y;
    const radius = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = rect.width / 2;

    const normX = Math.max(-1, Math.min(1, dx / maxRadius));
    const normY = Math.max(-1, Math.min(1, dy / maxRadius));

    onTiltChange(normX, normY);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-gray-800 bg-opacity-50 touch-none"
    >
      <div className="w-full h-full border-2 border-white rounded-full pointer-events-none"></div>
    </div>
  );
};