import React, { ReactNode } from 'react';
import { View, Modal, StyleProp, ViewStyle, Pressable } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useAppTheme } from '@/hooks/useAppTheme';
import ThemedText from './ThemedText';
import ThemedButton from './ThemedButton';

interface ThemedModalProps {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showCloseButton?: boolean;
  dismissOnBackdropPress?: boolean;
  footer?: ReactNode;
}

/**
 * A themed modal component with proper theming
 * Provides a consistent modal experience with title, content, and footer
 */
export default function ThemedModal({
  visible,
  onDismiss,
  title,
  children,
  style,
  contentContainerStyle,
  showCloseButton = true,
  dismissOnBackdropPress = true,
  footer,
}: ThemedModalProps) {
  const theme = useAppTheme();

  // Create theme-aware styles
  const styles = useThemedStyles((theme) => ({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '90%',
      maxWidth: 500,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontWeight: 'bold',
    },
    content: {
      padding: theme.spacing.md,
    },
    footer: {
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable
        style={styles.backdrop}
        onPress={dismissOnBackdropPress ? onDismiss : undefined}
      >
        <Pressable style={[styles.modalContainer, style]} onPress={(e) => e.stopPropagation()}>
          {title && (
            <View style={styles.header}>
              <ThemedText variant="subtitle" style={styles.headerTitle}>
                {title}
              </ThemedText>
              {showCloseButton && (
                <ThemedButton
                  mode="text"
                  onPress={onDismiss}
                >
                  Close
                </ThemedButton>
              )}
            </View>
          )}

          <View style={[styles.content, contentContainerStyle]}>
            {children}
          </View>

          {footer && <View style={styles.footer}>{footer}</View>}
        </Pressable>
      </Pressable>
    </Modal>
  );
} 