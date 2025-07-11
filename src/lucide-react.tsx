import React from 'react';

export type IconProps = React.SVGProps<SVGSVGElement>;

const Placeholder = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <svg ref={ref} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props} />
));

export const AlertCircle = Placeholder;
export const ArrowLeft = Placeholder;
export const ArrowRight = Placeholder;
export const Check = Placeholder;
export const ChevronDown = Placeholder;
export const ChevronLeft = Placeholder;
export const ChevronRight = Placeholder;
export const ChevronUp = Placeholder;
export const Circle = Placeholder;
export const GripVertical = Placeholder;
export const Minus = Placeholder;
export const MoreHorizontal = Placeholder;
export const PanelLeft = Placeholder;
export const RotateCw = Placeholder;
export const Search = Placeholder;
export const Trophy = Placeholder;
export const Volume2 = Placeholder;
export const VolumeX = Placeholder;
export const X = Placeholder;

export default {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  GripVertical,
  Minus,
  MoreHorizontal,
  PanelLeft,
  RotateCw,
  Search,
  Trophy,
  Volume2,
  VolumeX,
  X,
};
