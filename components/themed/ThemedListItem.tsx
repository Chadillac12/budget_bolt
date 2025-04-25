import React, { ReactNode } from 'react';
import { View, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useAppTheme } from '@/hooks/useAppTheme';
import ThemedText from './ThemedText';

interface ThemedListItemProps {
  title: string;
  subtitle?: string;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showBorder?: boolean;
  isSelected?: boolean;
  disabled?: boolean;
}

/**
 * A themed list item component for consistent list styling
 * Can display title, subtitle, and optional left and right content
 */
export default function ThemedListItem({
  title,
  subtitle,
  leftContent,
  rightContent,
  onPress,
  style,
  contentContainerStyle,
  showBorder = true,
  isSelected = false,
  disabled = false,
}: ThemedListItemProps) {
  const theme = useAppTheme();

  // Create theme-aware styles
  const styles = useThemedStyles((theme) => ({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: isSelected ? theme.colors.primaryContainer : theme.colors.card,
      borderBottomWidth: showBorder ? 1 : 0,
      borderBottomColor: theme.colors.border,
      opacity: disabled ? 0.6 : 1,
    },
    contentContainer: {
      flex: 1,
      marginHorizontal: theme.spacing.sm,
    },
    leftContainer: {
      marginRight: theme.spacing.sm,
    },
    rightContainer: {
      marginLeft: theme.spacing.sm,
    },
    title: {
      marginBottom: subtitle ? theme.spacing.xs : 0,
      color: isSelected ? theme.colors.primary : theme.colors.text,
    },
    subtitle: {
      color: theme.colors.textSecondary,
    },
  }));

  const ListContent = () => (
    <View style={[styles.container, style]}>
      {leftContent && <View style={styles.leftContainer}>{leftContent}</View>}
      
      <View style={[styles.contentContainer, contentContainerStyle]}>
        <ThemedText variant="body" style={styles.title}>
          {title}
        </ThemedText>
        
        {subtitle && (
          <ThemedText variant="caption" style={styles.subtitle}>
            {subtitle}
          </ThemedText>
        )}
      </View>
      
      {rightContent && <View style={styles.rightContainer}>{rightContent}</View>}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          { opacity: pressed ? 0.7 : 1 }
        ]}
      >
        <ListContent />
      </Pressable>
    );
  }

  return <ListContent />;
} 