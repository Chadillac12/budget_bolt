import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useAppContext } from '@/context/AppContext';
import { NetWorthDataPoint } from '@/types/netWorth';
import { formatCurrency } from '@/utils/dateUtils';
import { Calendar, TrendingUp, TrendingDown, Trash2 } from 'lucide-react-native';

interface NetWorthHistoryProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function NetWorthHistory({ isVisible, onClose }: NetWorthHistoryProps) {
  const { state, dispatch } = useAppContext();
  
  // Sort history by date (newest first)
  const sortedHistory = [...state.netWorthHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Handle snapshot deletion
  const handleDeleteSnapshot = (snapshot: NetWorthDataPoint) => {
    Alert.alert(
      'Delete Snapshot',
      'Are you sure you want to delete this snapshot? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch({
              type: 'DELETE_NET_WORTH_SNAPSHOT',
              payload: snapshot.id
            });
          },
        },
      ]
    );
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculate change from previous snapshot
  const calculateChange = (index: number) => {
    if (index === sortedHistory.length - 1) {
      // First snapshot, no previous to compare
      return { amount: 0, percentage: 0 };
    }
    
    const current = sortedHistory[index];
    const previous = sortedHistory[index + 1];
    
    const changeAmount = current.netWorth - previous.netWorth;
    const changePercentage = previous.netWorth !== 0 
      ? (changeAmount / Math.abs(previous.netWorth)) * 100 
      : 0;
    
    return {
      amount: changeAmount,
      percentage: changePercentage
    };
  };
  
  // Render a snapshot item
  const renderSnapshotItem = ({ item, index }: { item: NetWorthDataPoint, index: number }) => {
    const change = calculateChange(index);
    
    return (
      <View style={styles.snapshotItem}>
        <View style={styles.snapshotHeader}>
          <View style={styles.dateContainer}>
            <Calendar size={16} color="#8E8E93" style={styles.dateIcon} />
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteSnapshot(item)}
          >
            <Trash2 size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.snapshotContent}>
          <View style={styles.netWorthContainer}>
            <Text style={styles.netWorthLabel}>Net Worth</Text>
            <Text style={[
              styles.netWorthValue,
              item.netWorth < 0 ? styles.negativeValue : null
            ]}>
              {formatCurrency(item.netWorth)}
            </Text>
          </View>
          
          {change.amount !== 0 && (
            <View style={styles.changeContainer}>
              {change.amount > 0 ? (
                <TrendingUp size={16} color="#34C759" />
              ) : (
                <TrendingDown size={16} color="#FF3B30" />
              )}
              <Text style={[
                styles.changeText,
                change.amount > 0 ? styles.positiveChange : styles.negativeChange
              ]}>
                {formatCurrency(Math.abs(change.amount))} ({Math.abs(change.percentage).toFixed(1)}%)
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.snapshotDetails}>
          <View style={styles.detailItem}>
            <View style={[styles.detailIndicator, styles.assetIndicator]} />
            <Text style={styles.detailLabel}>Assets</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.assets)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <View style={[styles.detailIndicator, styles.liabilityIndicator]} />
            <Text style={styles.detailLabel}>Liabilities</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.liabilities)}</Text>
          </View>
        </View>
        
        {/* Account snapshots summary */}
        <View style={styles.accountsContainer}>
          <Text style={styles.accountsTitle}>
            {item.accountSnapshots.length} accounts included
          </Text>
        </View>
      </View>
    );
  };
  
  // If history is visible, render the history list
  if (!isVisible) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Net Worth History</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
      
      {sortedHistory.length > 0 ? (
        <FlatList
          data={sortedHistory}
          renderItem={renderSnapshotItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No snapshots found</Text>
          <Text style={styles.emptyStateSubtext}>
            Create snapshots to track your net worth over time
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  snapshotItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  snapshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 6,
  },
  dateText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  deleteButton: {
    padding: 4,
  },
  snapshotContent: {
    marginBottom: 12,
  },
  netWorthContainer: {
    marginBottom: 4,
  },
  netWorthLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  netWorthValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  negativeValue: {
    color: '#FF3B30',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  positiveChange: {
    color: '#34C759',
  },
  negativeChange: {
    color: '#FF3B30',
  },
  snapshotDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  assetIndicator: {
    backgroundColor: '#34C759',
  },
  liabilityIndicator: {
    backgroundColor: '#FF3B30',
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 6,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  accountsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
  },
  accountsTitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});