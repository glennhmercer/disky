import { useState, useCallback } from "react";
import type { Vector2D } from "../lib/gameTypes";

export const useGameInput = () => {
  const [mousePosition, setMousePosition] = useState<Vector2D>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const onMouseDown = useCallback((position: Vector2D) => {
    setMousePosition(position);
    setIsDragging(true);
  }, []);

  const onMouseMove = useCallback((position: Vector2D) => {
    setMousePosition(position);
  }, []);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    mousePosition,
    isDragging,
    onMouseDown,
    onMouseMove,
    onMouseUp,
  };
};
