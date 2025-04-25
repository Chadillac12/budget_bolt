import React from 'react';
import { Svg, Path, SvgProps } from 'react-native-svg';

interface IconProps extends SvgProps {
  size?: number;
  color?: string;
}

/**
 * Arrow Down Left icon (for income)
 */
export const ArrowDownLeft = ({ size = 24, color = '#000', ...props }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M17 7L7 17"
    />
    <Path 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M17 17H7V7"
    />
  </Svg>
);

/**
 * Arrow Up Right icon (for expenses)
 */
export const ArrowUpRight = ({ size = 24, color = '#000', ...props }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M7 7h10v10"
    />
    <Path 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M7 17L17 7"
    />
  </Svg>
);

/**
 * Chevron Right icon (for navigation)
 */
export const ChevronRight = ({ size = 24, color = '#000', ...props }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="m9 18 6-6-6-6"
    />
  </Svg>
); 