import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useAppContext } from '@/context/AppContext';
import { ReconciliationSession } from '@/types/reconciliation';
import { formatCurrency, formatDate } from '@/utils/dateUtils';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react-native';

interface ReconciliationHistoryProps {
  accountId: string;
  onSelectSession?: (session: ReconciliationSession) => void;
}

export default function ReconciliationHistory({ 
  accountId, 
  onSelectSession 
}: ReconciliationHistoryProps) {
  const { state } = useAppContext();
  
  // Get reconciliation sessions for this account
  const accountSessions = state.reconciliationSessions.filter(
    session => session.accountId === accountId
  );
  
  // Sort sessions by date (newest first)
  const sortedSessions = [...accountSessions].sort((a, b) => {
    const dateA = a.completedDate || a.startDate;
    const dateB = b.completedDate || b.startDate;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
  
  // Get statement details for each session
  const sessionsWithDetails = sortedSessions.map(session => {
    const statement = state.reconciliationStatements.find(
      stmt => stmt.id === session.statementId
    );
    
    return {
      ...session,
      statement
    };
  });
  
  // Render status icon based on session status
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={18} color="#34C759" />;
      case 'in-progress':
        return <Clock size={18} color="#FF9500" />;
      case 'abandoned':
        return <AlertCircle size={18} color="#FF3B30" />;
      default:
        return null;
    }
  };
  
  // Render status text based on session status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'abandoned':
        return 'Abandoned';
      default:
        return 'Unknown';
    }
  };
  
  // Render status color based on session status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#34C759';
      case 'in-progress':
        return '#FF9500';
      case 'abandoned':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };
  
  // Render a session item
  const renderSessionItem = ({ item }: { item: ReconciliationSession & { statement?: any } }) => {
    const statusColor = getStatusColor(item.status);
    const statusText = getStatusText(item.status);
    
    return (
      <TouchableOpacity
        style={styles.sessionItem}
        onPress={() => onSelectSession && onSelectSession(item)}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>Statement Period:</Text>
            <Text style={styles.dateValue}>
              {item.statement ? (
                `${formatDate(new Date(item.statement.startDate))} - ${formatDate(new Date(item.statement.endDate))}`
              ) : (
                'Unknown Period'
              )}
            </Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            {renderStatusIcon(item.status)}
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
        </View>
        
        <View style={styles.sessionDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Starting Balance:</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(item.startingBalance)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ending Balance:</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(item.endingBalance)}
            </Text>
          </View>
          
          {item.actualEndingBalance !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Actual Balance:</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(item.actualEndingBalance)}
              </Text>
            </View>
          )}
          
          {item.difference !== undefined && item.difference !== 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Difference:</Text>
              <Text style={[styles.detailValue, styles.differenceText]}>
                {formatCurrency(Math.abs(item.difference))}
              </Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transactions Cleared:</Text>
            <Text style={styles.detailValue}>
              {item.clearedTransactions.length}
            </Text>
          </View>
          
          {item.completedDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Completed On:</Text>
              <Text style={styles.detailValue}>
                {formatDate(new Date(item.completedDate))}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reconciliation History</Text>
      
      {sessionsWithDetails.length > 0 ? (
        <FlatList
          data={sessionsWithDetails}
          keyExtractor={(item) => item.id}
          renderItem={renderSessionItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No reconciliation history found for this account.
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sessionItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  dateContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  sessionDetails: {
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  differenceText: {
    color: '#FF3B30',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});