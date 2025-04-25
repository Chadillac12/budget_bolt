import React from 'react';
import { StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Surface } from 'react-native-paper';

interface ThemedCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  borderLeftColor?: string;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5; // Material elevation levels
}

/**
 * A themed card component that can be used throughout the app
 * Applies consistent theming to card elements using Paper's Surface component
 */
export default function ThemedCard({ 
  children, 
  style, 
  onPress, 
  borderLeftColor,
  elevation = 1
}: ThemedCardProps) {
  const theme = useAppTheme();
  
  const cardStyle = [
    styles.card, 
    { 
      borderLeftColor: borderLeftColor || theme.colors.primary,
      borderLeftWidth: borderLeftColor ? 4 : 0,
      backgroundColor: theme.colors.card,
    },
    style
  ];
  
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          { opacity: pressed ? 0.9 : 1 }
        ]}
      >
        <Surface style={cardStyle} elevation={elevation}>
          {children}
        </Surface>
      </Pressable>
    );
  }
  
  return (
    <Surface style={cardStyle} elevation={elevation}>
      {children}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
  },
}); 