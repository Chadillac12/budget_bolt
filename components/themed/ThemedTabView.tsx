import React, { useState, ReactElement, ReactNode } from 'react';
import { View, ScrollView, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useAppTheme } from '@/hooks/useAppTheme';
import ThemedText from './ThemedText';

interface TabItem {
  key: string;
  title: string;
  icon?: ReactNode;
  content: ReactElement;
}

interface ThemedTabViewProps {
  tabs: TabItem[];
  initialTabKey?: string;
  style?: StyleProp<ViewStyle>;
  tabBarStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  variant?: 'primary' | 'secondary';
  onTabChange?: (tabKey: string) => void;
}

/**
 * A themed tab view component for tab navigation
 * Supports icons, scrollable tabs, and different variants
 */
export default function ThemedTabView({
  tabs,
  initialTabKey,
  style,
  tabBarStyle,
  contentContainerStyle,
  scrollable = false,
  variant = 'primary',
  onTabChange,
}: ThemedTabViewProps) {
  const theme = useAppTheme();
  const [activeTab, setActiveTab] = useState(initialTabKey || tabs[0]?.key || '');

  // Create theme-aware styles
  const styles = useThemedStyles((theme) => ({
    container: {
      flex: 1,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tabBarScrollable: {
      paddingHorizontal: theme.spacing.sm,
    },
    tabBarFixed: {
      justifyContent: 'space-around',
    },
    tab: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
    },
    tabText: {
      fontWeight: '500',
      marginLeft: theme.spacing.xs,
    },
    activeTabText: {
      fontWeight: 'bold',
    },
    content: {
      flex: 1,
    },
  }));

  // Get colors based on variant
  const getColors = () => {
    switch (variant) {
      case 'secondary':
        return {
          activeColor: theme.colors.secondary,
          inactiveColor: theme.colors.textSecondary,
        };
      case 'primary':
      default:
        return {
          activeColor: theme.colors.primary,
          inactiveColor: theme.colors.textSecondary,
        };
    }
  };

  const { activeColor, inactiveColor } = getColors();

  const handleTabPress = (tabKey: string) => {
    setActiveTab(tabKey);
    if (onTabChange) {
      onTabChange(tabKey);
    }
  };

  // Render tab bar based on scrollable prop
  const renderTabBar = () => {
    const TabContainer = scrollable ? ScrollView : View;
    const containerProps = scrollable
      ? {
          horizontal: true,
          showsHorizontalScrollIndicator: false,
          contentContainerStyle: styles.tabBarScrollable,
        }
      : {};

    return (
      <TabContainer
        style={[
          styles.tabBar,
          scrollable ? null : styles.tabBarFixed,
          tabBarStyle,
        ]}
        {...containerProps}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const tabColor = isActive ? activeColor : inactiveColor;

          return (
            <Pressable
              key={tab.key}
              style={[
                styles.tab,
                isActive && { ...styles.activeTab, borderBottomColor: activeColor },
              ]}
              onPress={() => handleTabPress(tab.key)}
            >
              {tab.icon && React.cloneElement(tab.icon as React.ReactElement, { color: tabColor })}
              <ThemedText
                style={[
                  styles.tabText,
                  { color: tabColor },
                  isActive && styles.activeTabText,
                ]}
              >
                {tab.title}
              </ThemedText>
            </Pressable>
          );
        })}
      </TabContainer>
    );
  };

  // Find the active tab content
  const activeTabContent = tabs.find((tab) => tab.key === activeTab)?.content;

  return (
    <View style={[styles.container, style]}>
      {renderTabBar()}
      <View style={[styles.content, contentContainerStyle]}>
        {activeTabContent}
      </View>
    </View>
  );
} 