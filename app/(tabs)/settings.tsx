import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  Switch
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppContext } from '@/context/AppContext';
import { User, Lock, Database, Upload, Download, Bell, Moon, Palette, CircleHelp as HelpCircle, Info, ChevronRight } from 'lucide-react-native';

export default function SettingsScreen() {
  const { state } = useAppContext();
  const [darkMode, setDarkMode] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);
  
  const toggleDarkMode = () => setDarkMode(prevState => !prevState);
  const toggleNotifications = () => setNotifications(prevState => !prevState);

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    onPress: () => void,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingItemLeft}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      
      {rightElement ? (
        rightElement
      ) : (
        <ChevronRight size={20} color="#8E8E93" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <ScrollView>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileIconContainer}>
            <User size={36} color="#007AFF" />
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>User Name</Text>
            <Text style={styles.profileEmail}>user@example.com</Text>
          </View>
          
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        {/* Account Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          {renderSettingItem(
            <User size={20} color="#007AFF" />,
            'Profile Information',
            () => {}
          )}
          
          {renderSettingItem(
            <Lock size={20} color="#5856D6" />,
            'Security',
            () => {}
          )}
        </View>
        
        {/* Data Management Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          {renderSettingItem(
            <Database size={20} color="#34C759" />,
            'Backup Data',
            () => {}
          )}
          
          {renderSettingItem(
            <Upload size={20} color="#FF9500" />,
            'Import Transactions',
            () => {}
          )}
          
          {renderSettingItem(
            <Download size={20} color="#FF2D55" />,
            'Export Transactions',
            () => {}
          )}
        </View>
        
        {/* Preferences Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          {renderSettingItem(
            <Bell size={20} color="#FF9500" />,
            'Notifications',
            toggleNotifications,
            <Switch
              value={notifications}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="white"
            />
          )}
          
          {renderSettingItem(
            <Moon size={20} color="#8E8E93" />,
            'Dark Mode',
            toggleDarkMode,
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="white"
            />
          )}
          
          {renderSettingItem(
            <Palette size={20} color="#AF52DE" />,
            'Appearance',
            () => {}
          )}
        </View>
        
        {/* Help & Support Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Help & Support</Text>
          
          {renderSettingItem(
            <HelpCircle size={20} color="#007AFF" />,
            'Help Center',
            () => {}
          )}
          
          {renderSettingItem(
            <Info size={20} color="#5856D6" />,
            'About',
            () => {}
          )}
        </View>
        
        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
  },
  profileIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F2F2F7',
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
    color: '#8E8E93',
  },
  editProfileButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
  },
  editProfileText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  settingsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
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
    borderBottomColor: '#F2F2F7',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: '#000',
  },
  versionContainer: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#8E8E93',
  },
});