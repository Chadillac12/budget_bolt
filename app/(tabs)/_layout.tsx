import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutAnimation, Platform, UIManager, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  ChartPie as PieChart,
  Calendar,
  Settings,
  Wand2,
  Users,
  CheckSquare,
  TrendingUp,
  BarChart,
  FileText,
  Link,
  Cloud,
  Download
} from 'lucide-react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function TabsLayout() {
  const appTheme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { isDark } = useTheme();

  // Configure layout animation
  const configureNextAnimation = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        300,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );
  };

  // Custom header styling using monospace font
  const headerTitleStyle = {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '500' as const,
  };

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: appTheme.colors.surface,
        },
        headerTintColor: appTheme.colors.text,
        headerTitleStyle,
        tabBarStyle: {
          backgroundColor: appTheme.colors.surface,
          borderTopColor: appTheme.colors.border,
        },
        tabBarActiveTintColor: appTheme.colors.primary,
        tabBarInactiveTintColor: appTheme.colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
          tabBarLabel: 'Dashboard',
          headerTitle: 'Dashboard',
          headerShown: true,
        }}
        listeners={{
          tabPress: () => configureNextAnimation(),
        }}
      />
      
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Accounts',
          tabBarIcon: ({ color, size }) => (
            <CreditCard size={size} color={color} />
          ),
          tabBarLabel: 'Accounts',
          headerTitle: 'Accounts',
          headerShown: true,
        }}
        listeners={{
          tabPress: () => configureNextAnimation(),
        }}
      />
      
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => (
            <Receipt size={size} color={color} />
          ),
          tabBarLabel: 'Transactions',
          headerTitle: 'Transactions',
          headerShown: true,
        }}
        listeners={{
          tabPress: () => configureNextAnimation(),
        }}
      />
      
      <Tabs.Screen
        name="rules"
        options={{
          title: 'Rules',
          tabBarIcon: ({ color, size }) => (
            <Wand2 size={size} color={color} />
          ),
          tabBarLabel: 'Rules',
          headerTitle: 'Categorization Rules',
          headerShown: true,
        }}
        listeners={{
          tabPress: () => configureNextAnimation(),
        }}
      />
      
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budget',
          tabBarIcon: ({ color, size }) => (
            <PieChart size={size} color={color} />
          ),
          tabBarLabel: 'Budget',
          headerTitle: 'Budget',
          headerShown: true,
        }}
        listeners={{
          tabPress: () => configureNextAnimation(),
        }}
      />
      
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
          ),
          tabBarLabel: 'Calendar',
          headerTitle: 'Financial Calendar',
          headerShown: true,
        }}
        listeners={{
          tabPress: () => configureNextAnimation(),
        }}
      />
      
      <Tabs.Screen
        name="networth"
        options={{
          title: 'Net Worth',
          tabBarIcon: ({ color, size }) => (
            <TrendingUp size={size} color={color} />
          ),
          tabBarLabel: 'Net Worth',
          headerTitle: 'Net Worth Tracking',
          headerShown: true,
        }}
        listeners={{
          tabPress: () => configureNextAnimation(),
        }}
      />
      
      <Tabs.Screen
        name="trends"
        options={{
          title: 'Trends',
          tabBarIcon: ({ color, size }) => (
            <BarChart size={size} color={color} />
          ),
          tabBarLabel: 'Trends',
          headerTitle: 'Trend Analysis',
          headerShown: true,
        }}
        listeners={{
          tabPress: () => configureNextAnimation(),
        }}
      />
      
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <FileText size={size} color={color} />
          ),
          tabBarLabel: 'Reports',
          headerTitle: 'Custom Reports',
          headerShown: true,
        }}
        listeners={{
          tabPress: () => configureNextAnimation(),
        }}
      />
      
      <Tabs.Screen
        name="reconcile"
        options={{
          title: 'Reconcile',
          tabBarIcon: ({ color, size }) => (
            <CheckSquare size={size} color={color} />
          ),
          tabBarLabel: 'Reconcile',
          headerTitle: 'Account Reconciliation',
          headerShown: true,
        }}
        listeners={{
          tabPress: () => configureNextAnimation(),
        }}
      />
      
      <Tabs.Screen
        name="payees"
        options={{
          title: 'Payees',
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
          tabBarLabel: 'Payees',
          headerTitle: 'Payee Management',
          headerShown: true,
        }}
        listeners={{
          tabPress: () => configureNextAnimation(),
        }}
      />
      
      <Tabs.Screen
        name="import"
        options={{
          title: 'Import',
          tabBarIcon: ({ color, size }) => (
            <Download size={size} color={color} />
          ),
          tabBarLabel: 'Import',
          headerTitle: 'Import Transactions',
          headerShown: true,
        }}
        listeners={{
          tabPress: () => configureNextAnimation(),
        }}
      />
      
      <Tabs.Screen
        name="connections"
        options={{
          title: 'Connections',
          tabBarIcon: ({ color, size }) => (
            <Link size={size} color={color} />
          ),
          tabBarLabel: 'Connections',
          headerTitle: 'Bank Connections',
          headerShown: true,
        }}
        listeners={{
          tabPress: () => configureNextAnimation(),
        }}
      />
      
      <Tabs.Screen
        name="sync"
        options={{
          title: 'Sync',
          tabBarIcon: ({ color, size }) => (
            <Cloud size={size} color={color} />
          ),
          tabBarLabel: 'Sync',
          headerTitle: 'Mobile/Desktop Sync',
          headerShown: true,
        }}
        listeners={{
          tabPress: () => configureNextAnimation(),
        }}
      />
      
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
          tabBarLabel: 'Settings',
          headerTitle: 'Settings',
          headerShown: true,
        }}
        listeners={{
          tabPress: () => configureNextAnimation(),
        }}
      />
    </Tabs>
  );
}

const createStyles = (theme: Theme) => ({
  // ... styles here
});