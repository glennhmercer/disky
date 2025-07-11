import React, { useState, useEffect, useRef } from "react";

interface JoystickProps {
  onTiltChange: (tiltX: number, tiltY: number) => void;
}

export const Joystick: React.FC<JoystickProps> = ({ onTiltChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) setCenter({ x: rect.width / 2, y: rect.height / 2 });
  }, []);

  const updateJoystick = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dx = clientX - rect.left - center.x;
    const dy = clientY - rect.top - center.y;
    const maxRadius = rect.width / 2;

    const clampedX = Math.max(-maxRadius, Math.min(maxRadius, dx));
    const clampedY = Math.max(-maxRadius, Math.min(maxRadius, dy));

    setStickPos({ x: clampedX, y: clampedY });
    const tiltX = clampedX / maxRadius;
    const tiltY = clampedY / maxRadius;
    onTiltChange(tiltX, tiltY);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateJoystick(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    e.preventDefault();
    updateJoystick(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    setDragging(false);
    setStickPos({ x: 0, y: 0 });
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
      <div className="w-full h-full border-2 border-white rounded-full pointer-events-none">
        <div
          className="w-4 h-4 bg-white rounded-full absolute"
          style={{
            left: `calc(50% + ${stickPos.x}px - 0.5rem)`,
            top: `calc(50% + ${stickPos.y}px - 0.5rem)`,
            transition: dragging ? 'none' : 'left 0.1s, top 0.1s',
          }}
        />
      </div>
    </div>
  );
};