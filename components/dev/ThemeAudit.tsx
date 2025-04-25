import React, { ReactNode, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

interface ThemeAuditProps {
  children: ReactNode;
  componentName?: string;
  disableWarnings?: boolean;
}

/**
 * A development component that wraps UI elements to audit their theme usage
 * This helps identify hardcoded colors and non-theme values
 * Only active in development builds
 */
export default function ThemeAudit({
  children,
  componentName = 'Unknown',
  disableWarnings = false,
}: ThemeAuditProps) {
  const theme = useAppTheme();
  
  // Extract all theme colors for checking
  const themeColors = Object.values(theme.colors);
  const isDev = __DEV__ && !disableWarnings;
  
  useEffect(() => {
    // Only run in development mode
    if (!isDev) return;
    
    // This is a simplified check that looks for hardcoded color values in the component tree
    const checkForHardcodedColors = (element: any) => {
      if (!element || typeof element !== 'object') return;
      
      // Check style props for hardcoded colors
      if (element.props?.style) {
        const style = element.props.style;
        
        // Handle array styles
        const styles = Array.isArray(style) ? style : [style];
        
        styles.forEach((styleItem: any) => {
          if (!styleItem || typeof styleItem !== 'object') return;
          
          // Look for color properties
          const colorProps = [
            'color', 'backgroundColor', 'borderColor', 'borderTopColor',
            'borderBottomColor', 'borderLeftColor', 'borderRightColor',
            'textColor', 'tintColor'
          ];
          
          colorProps.forEach(prop => {
            const colorValue = styleItem[prop];
            
            // Skip if no color value or if it's using a theme color
            if (!colorValue || typeof colorValue !== 'string') return;
            if (themeColors.includes(colorValue)) return;
            
            // Check if it's a non-theme color (likely hardcoded)
            if (colorValue.startsWith('#') || colorValue.startsWith('rgb')) {
              console.warn(
                `[ThemeAudit] Hardcoded color detected in ${componentName}:`,
                `${prop}: ${colorValue}`,
                `\nConsider using theme colors instead.`
              );
            }
          });
        });
      }
      
      // Recursively check children
      if (element.props?.children) {
        React.Children.forEach(element.props.children, checkForHardcodedColors);
      }
    };
    
    // Run the check
    checkForHardcodedColors(children);
  }, [children, componentName, isDev, themeColors]);
  
  // In development, wrap with a subtle border to identify audited components
  if (isDev) {
    return (
      <View style={styles.container}>
        {children}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{componentName}</Text>
        </View>
      </View>
    );
  }
  
  // In production, just render children
  return <>{children}</>;
}

// These styles are only used in development
const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0, 128, 255, 0.2)',
    borderStyle: 'dashed',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0, 128, 255, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderBottomLeftRadius: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
}); 