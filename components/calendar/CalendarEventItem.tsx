import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Transaction, RecurringTransaction } from '@/types/transaction';
import { formatCurrency } from '@/utils/dateUtils';
import { Calendar, Repeat } from 'lucide-react-native';

interface CalendarEventItemProps {
  transaction: Transaction | RecurringTransaction;
  onPress: (transaction: Transaction | RecurringTransaction) => void;
  isRecurring?: boolean;
  isPast?: boolean;
}

export default function CalendarEventItem({
  transaction,
  onPress,
  isRecurring = false,
  isPast = false,
}: CalendarEventItemProps) {
  const getAmountColor = () => {
    if (isPast) return '#8E8E93'; // Gray for past transactions
    
    switch (transaction.type) {
      case 'income':
        return '#34C759'; // Green
      case 'expense':
        return '#FF3B30'; // Red
      case 'transfer':
        return '#5856D6'; // Purple
      default:
        return '#000';
    }
  };

  const getAmountPrefix = () => {
    switch (transaction.type) {
      case 'income':
        return '+';
      case 'expense':
        return '-';
      default:
        return '';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isPast && styles.pastContainer,
      ]}
      onPress={() => onPress(transaction)}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        <View style={[
          styles.iconContainer,
          { opacity: isPast ? 0.6 : 1 }
        ]}>
          {isRecurring ? (
            <Repeat size={18} color="#5856D6" />
          ) : (
            <Calendar size={18} color="#007AFF" />
          )}
        </View>
        
        <View style={styles.textContent}>
          <Text
            style={[
              styles.payeeText,
              isPast && styles.pastText,
            ]}
            numberOfLines={1}
          >
            {transaction.payee}
          </Text>
          
          {transaction.description ? (
            <Text
              style={[
                styles.descriptionText,
                isPast && styles.pastText,
              ]}
              numberOfLines={1}
            >
              {transaction.description}
            </Text>
          ) : null}
        </View>
      </View>
      
      <Text
        style={[
          styles.amountText,
          { color: getAmountColor() },
        ]}
      >
        {getAmountPrefix()}
        {formatCurrency(Math.abs(transaction.amount))}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pastContainer: {
    opacity: 0.7,
    backgroundColor: '#F9F9F9',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  payeeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  descriptionText: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pastText: {
    color: '#8E8E93',
  },
});