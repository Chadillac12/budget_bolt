import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import { LayoutDashboard, CreditCard, Receipt, ChartPie as PieChart, Calendar, Settings } from 'lucide-react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function TabLayout() {
  // Configure layout animation
  const configureNextAnimation = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#E5E5EA',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 0,
        },
        headerStyle: {
          backgroundColor: 'white',
          borderBottomColor: '#E5E5EA',
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
        },
        headerShadowVisible: false,
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