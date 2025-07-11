import { useState, useEffect } from "react";
import { useIsMobile } from "./use-is-mobile";

export interface LayoutInfo {
  width: number;
  height: number;
  isMobile: boolean;
}

const DESIGN_RATIO = 16 / 9;

export function useLayoutManager(): LayoutInfo {
  const isMobile = useIsMobile();
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));

  useEffect(() => {
    const handleResize = () => {
      let w = window.innerWidth;
      let h = window.innerHeight;
      if (w / h > DESIGN_RATIO) {
        w = h * DESIGN_RATIO;
      } else {
        h = w / DESIGN_RATIO;
      }
      setSize({ width: w, height: h });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  return { ...size, isMobile };
}
