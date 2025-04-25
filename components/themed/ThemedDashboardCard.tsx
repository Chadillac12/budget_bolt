import React, { ReactNode } from 'react';
import { View, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useAppTheme } from '@/hooks/useAppTheme';
import ThemedText from './ThemedText';
import ThemedDivider from './ThemedDivider';

interface ThemedDashboardCardProps {
  title?: string;
  titleRight?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
  footerStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  showDividers?: boolean;
}

/**
 * A themed dashboard card component for consistent dashboard panels
 * Includes header with title and right action, body content, and optional footer
 */
export default function ThemedDashboardCard({
  title,
  titleRight,
  children,
  footer,
  style,
  headerStyle,
  bodyStyle,
  footerStyle,
  onPress,
  showDividers = true,
}: ThemedDashboardCardProps) {
  const theme = useAppTheme();
  
  // Theme-aware styles
  const styles = useThemedStyles((theme) => ({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      marginVertical: theme.spacing.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    title: {
      color: theme.colors.primary,
    },
    body: {
      padding: theme.spacing.md,
    },
    footer: {
      padding: theme.spacing.md,
    },
    pressable: {
      opacity: 1,
    }
  }));

  const CardContent = () => (
    <View style={[styles.container, style]}>
      {title && (
        <>
          <View style={[styles.header, headerStyle]}>
            <ThemedText variant="subtitle" style={styles.title}>
              {title}
            </ThemedText>
            {titleRight}
          </View>
          {showDividers && <ThemedDivider />}
        </>
      )}
      
      <View style={[styles.body, bodyStyle]}>
        {children}
      </View>
      
      {footer && (
        <>
          {showDividers && <ThemedDivider />}
          <View style={[styles.footer, footerStyle]}>
            {footer}
          </View>
        </>
      )}
    </View>
  );

  // Render with or without pressable wrapper
  if (onPress) {
    return (
      <Pressable 
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          { opacity: pressed ? 0.9 : 1 }
        ]}
      >
        <CardContent />
      </Pressable>
    );
  }
  
  return <CardContent />;
} 