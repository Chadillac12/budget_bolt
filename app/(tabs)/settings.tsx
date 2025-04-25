import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  Switch,
  Alert,
  Linking
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppContext } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';
import { ThemedScreen, ThemedText } from '@/components/themed';
import { User, Lock, Database, Upload, Download, Bell, Moon, Palette, CircleHelp as HelpCircle, Info, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const appTheme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { state } = useAppContext();
  const { isDark, toggleTheme: originalToggleTheme } = useTheme();
  const [notifications, setNotifications] = React.useState(true);
  
  const toggleNotifications = () => {
    console.log('Toggling notifications from', notifications, 'to', !notifications);
    setNotifications(prevState => !prevState);
  };

  const handleThemeToggle = () => {
    originalToggleTheme();
  };

  const handleProfilePress = () => {
    Alert.alert('Profile', 'Profile editing will be available in a future update.');
  };

  const handleSecurityPress = () => {
    Alert.alert('Security', 'Security settings will be available in a future update.');
  };

  const handleBackupPress = () => {
    Alert.alert('Backup Data', 'Data backup feature will be available in a future update.');
  };

  const handleImportPress = () => {
    router.push('/import');
  };

  const handleExportPress = () => {
    Alert.alert('Export', 'Data export feature will be available in a future update.');
  };

  const handleAppearancePress = () => {
    Alert.alert('Appearance', 'Additional appearance settings will be available in a future update.');
  };

  const handleHelpPress = () => {
    Linking.openURL('https://www.example.com/help');
  };

  const handleAboutPress = () => {
    Alert.alert('About Budget Bolt', 'Version 1.0.0\n\nA comprehensive personal budget tracker application with visual financial planning and real-time updates.', [
      { text: 'OK' }
    ]);
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    onPress: () => void,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity 
      style={[
        styles.settingItem, 
        { 
          borderBottomColor: appTheme.colors.border, 
          backgroundColor: appTheme.colors.card 
        }
      ]} 
      onPress={onPress}
    >
      <View style={styles.settingItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: appTheme.colors.background }]}>
          {icon}
        </View>
        <Text style={[styles.settingTitle, { color: appTheme.colors.text }]}>{title}</Text>
      </View>
      
      {rightElement ? (
        rightElement
      ) : (
        <ChevronRight size={20} color={appTheme.colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  // New function for rendering items with switches
  const renderSwitchItem = (
    icon: React.ReactNode,
    title: string,
    value: boolean,
    onValueChange: () => void
  ) => (
    <View 
      style={[
        styles.settingItem, 
        { 
          borderBottomColor: appTheme.colors.border, 
          backgroundColor: appTheme.colors.card 
        }
      ]} 
    >
      <View style={styles.settingItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: appTheme.colors.background }]}>
          {icon}
        </View>
        <Text style={[styles.settingTitle, { color: appTheme.colors.text }]}>{title}</Text>
      </View>
      
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ 
          false: appTheme.colors.border, 
          true: appTheme.colors.primary 
        }}
        thumbColor={appTheme.colors.card}
      />
    </View>
  );

  return (
    <ThemedScreen>
      <ScrollView>
        {/* Profile Section */}
        <View style={[styles.profileSection, { backgroundColor: appTheme.colors.card }]}>
          <View style={[styles.profileIconContainer, { backgroundColor: appTheme.colors.background }]}>
            <User size={36} color={appTheme.colors.primary} />
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: appTheme.colors.text }]}>User Name</Text>
            <Text style={[styles.profileEmail, { color: appTheme.colors.textSecondary }]}>user@example.com</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.editProfileButton, { backgroundColor: appTheme.colors.background }]}
            onPress={handleProfilePress}
          >
            <Text style={[styles.editProfileText, { color: appTheme.colors.primary }]}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        {/* Account Section */}
        <View style={[styles.settingsSection, { backgroundColor: appTheme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.textSecondary }]}>Account</Text>
          
          {renderSettingItem(
            <User size={20} color={appTheme.colors.primary} />,
            'Profile Information',
            handleProfilePress
          )}
          
          {renderSettingItem(
            <Lock size={20} color={appTheme.colors.secondary} />,
            'Security',
            handleSecurityPress
          )}
        </View>
        
        {/* Data Management Section */}
        <View style={[styles.settingsSection, { backgroundColor: appTheme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.textSecondary }]}>Data Management</Text>
          
          {renderSettingItem(
            <Database size={20} color={appTheme.colors.success} />,
            'Backup Data',
            handleBackupPress
          )}
          
          {renderSettingItem(
            <Upload size={20} color={appTheme.colors.warning} />,
            'Import Transactions',
            handleImportPress
          )}
          
          {renderSettingItem(
            <Download size={20} color={appTheme.colors.error} />,
            'Export Transactions',
            handleExportPress
          )}
        </View>
        
        {/* Preferences Section */}
        <View style={[styles.settingsSection, { backgroundColor: appTheme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.textSecondary }]}>Preferences</Text>
          
          {renderSwitchItem(
            <Bell size={20} color={appTheme.colors.warning} />,
            'Notifications',
            notifications,
            toggleNotifications
          )}
          
          {renderSwitchItem(
            <Moon size={20} color={isDark ? appTheme.colors.primary : appTheme.colors.textSecondary} />,
            'Dark Mode',
            isDark,
            handleThemeToggle
          )}
          
          {renderSettingItem(
            <Palette size={20} color={appTheme.colors.secondary} />,
            'Appearance',
            handleAppearancePress
          )}
        </View>
        
        {/* Help & Support Section */}
        <View style={[styles.settingsSection, { backgroundColor: appTheme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.textSecondary }]}>Help & Support</Text>
          
          {renderSettingItem(
            <HelpCircle size={20} color={appTheme.colors.primary} />,
            'Help Center',
            handleHelpPress
          )}
          
          {renderSettingItem(
            <Info size={20} color={appTheme.colors.secondary} />,
            'About',
            handleAboutPress
          )}
        </View>
        
        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: appTheme.colors.textSecondary }]}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </ThemedScreen>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  profileIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  editProfileButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingsSection: {
    borderRadius: 12,
    marginBottom: 20,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginHorizontal: 16,
    marginTop: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
  },
  versionContainer: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    fontSize: 14,
  },
});