import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Switch, Modal, ScrollView } from 'react-native';
import { useAppContext } from '@/context/AppContext';
import { NetWorthSnapshotSettings } from '@/types/netWorth';
import { Calendar, X, Check } from 'lucide-react-native';

interface NetWorthSettingsProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function NetWorthSettings({ isVisible, onClose }: NetWorthSettingsProps) {
  const { state, dispatch } = useAppContext();
  
  // Local state for settings
  const [settings, setSettings] = useState<NetWorthSnapshotSettings>({
    ...state.netWorthSettings
  });
  
  // Frequency options
  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];
  
  // Day of week options (for weekly frequency)
  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];
  
  // Days of month options (for monthly frequency)
  const daysOfMonth = Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}${getDaySuffix(i + 1)}`
  }));
  
  // Helper function to get day suffix (1st, 2nd, 3rd, etc.)
  function getDaySuffix(day: number): string {
    if (day >= 11 && day <= 13) {
      return 'th';
    }
    
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
  
  // Handle toggle for automatic snapshots
  const handleToggleEnabled = () => {
    setSettings({
      ...settings,
      enabled: !settings.enabled
    });
  };
  
  // Handle frequency change
  const handleFrequencyChange = (frequency: 'daily' | 'weekly' | 'monthly') => {
    setSettings({
      ...settings,
      frequency,
      // Set default day of week/month if needed
      dayOfWeek: frequency === 'weekly' ? 1 : undefined, // Monday
      dayOfMonth: frequency === 'monthly' ? 1 : undefined, // 1st day
    });
  };
  
  // Handle day of week change
  const handleDayOfWeekChange = (dayOfWeek: number) => {
    setSettings({
      ...settings,
      dayOfWeek
    });
  };
  
  // Handle day of month change
  const handleDayOfMonthChange = (dayOfMonth: number) => {
    setSettings({
      ...settings,
      dayOfMonth
    });
  };
  
  // Save settings
  const handleSave = () => {
    dispatch({
      type: 'UPDATE_NET_WORTH_SETTINGS',
      payload: settings
    });
    
    onClose();
  };
  
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Net Worth Settings</Text>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Check size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          {/* Settings Content */}
          <ScrollView style={styles.settingsContainer}>
            {/* Automatic Snapshots */}
            <View style={styles.settingSection}>
              <View style={styles.settingRow}>
                <View style={styles.settingLabelContainer}>
                  <Calendar size={20} color="#007AFF" style={styles.settingIcon} />
                  <Text style={styles.settingLabel}>Automatic Snapshots</Text>
                </View>
                <Switch
                  value={settings.enabled}
                  onValueChange={handleToggleEnabled}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              
              <Text style={styles.settingDescription}>
                Automatically create net worth snapshots at regular intervals
              </Text>
            </View>
            
            {/* Frequency Selection (only shown if automatic snapshots are enabled) */}
            {settings.enabled && (
              <View style={styles.settingSection}>
                <Text style={styles.sectionTitle}>Snapshot Frequency</Text>
                
                <View style={styles.optionsContainer}>
                  {frequencyOptions.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        settings.frequency === option.value && styles.selectedOption
                      ]}
                      onPress={() => handleFrequencyChange(option.value as any)}
                    >
                      <Text style={[
                        styles.optionText,
                        settings.frequency === option.value && styles.selectedOptionText
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Day of Week Selection (for weekly frequency) */}
                {settings.frequency === 'weekly' && (
                  <View style={styles.subSettingSection}>
                    <Text style={styles.subSectionTitle}>Day of Week</Text>
                    
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysContainer}>
                      {daysOfWeek.map(day => (
                        <TouchableOpacity
                          key={day.value}
                          style={[
                            styles.dayButton,
                            settings.dayOfWeek === day.value && styles.selectedDay
                          ]}
                          onPress={() => handleDayOfWeekChange(day.value)}
                        >
                          <Text style={[
                            styles.dayText,
                            settings.dayOfWeek === day.value && styles.selectedDayText
                          ]}>
                            {day.label.substring(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                
                {/* Day of Month Selection (for monthly frequency) */}
                {settings.frequency === 'monthly' && (
                  <View style={styles.subSettingSection}>
                    <Text style={styles.subSectionTitle}>Day of Month</Text>
                    
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysContainer}>
                      {daysOfMonth.map(day => (
                        <TouchableOpacity
                          key={day.value}
                          style={[
                            styles.dayButton,
                            settings.dayOfMonth === day.value && styles.selectedDay
                          ]}
                          onPress={() => handleDayOfMonthChange(day.value)}
                        >
                          <Text style={[
                            styles.dayText,
                            settings.dayOfMonth === day.value && styles.selectedDayText
                          ]}>
                            {day.value}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
            
            {/* Information Section */}
            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>About Net Worth Tracking</Text>
              <Text style={styles.infoText}>
                Net worth is calculated as the sum of all your assets minus the sum of all your liabilities.
              </Text>
              <Text style={styles.infoText}>
                Regular snapshots help you track changes in your net worth over time, giving you insights into your financial progress.
              </Text>
              <Text style={styles.infoText}>
                You can also create manual snapshots at any time from the Net Worth screen.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 4,
  },
  saveButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  settingsContainer: {
    flex: 1,
    padding: 16,
  },
  settingSection: {
    marginBottom: 24,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  selectedOptionText: {
    color: 'white',
  },
  subSettingSection: {
    marginTop: 16,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  daysContainer: {
    flexDirection: 'row',
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  selectedDay: {
    backgroundColor: '#007AFF',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  selectedDayText: {
    color: 'white',
  },
  infoSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#3A3A3C',
    marginBottom: 8,
    lineHeight: 20,
  },
});