import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Dimensions 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppContext } from '@/context/AppContext';
import CalendarEventItem from '@/components/calendar/CalendarEventItem';
import { formatCurrency, formatDate, formatMonthYear } from '@/utils/dateUtils';
import { Transaction, RecurringTransaction, TransactionType } from '@/types/transaction';
import { Calendar as CalendarIcon, Plus, ChevronDown, Search, Tag, ArrowLeft, BarChart3 } from 'lucide-react-native';
import moment from 'moment';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';

export default function CalendarScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { state } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Mock financial events data (in a real app, this would come from state)
  const financialEvents = [
    {
      id: '1',
      accountId: '1',
      date: new Date(),
      payee: 'Rent Payment',
      amount: -1500,
      type: 'expense' as const,
      categoryId: '1',
      description: 'Monthly rent',
      isReconciled: false,
      isCleared: false,
      tags: ['housing'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      accountId: '1',
      date: new Date(),
      payee: 'Grocery Store',
      amount: -120.50,
      type: 'expense' as const,
      categoryId: '2',
      description: 'Weekly groceries',
      isReconciled: false,
      isCleared: false,
      tags: ['food'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      accountId: '1',
      date: new Date(new Date().setDate(new Date().getDate() + 1)),
      payee: 'Paycheck',
      amount: 2500,
      type: 'income' as const,
      categoryId: '3',
      description: 'Biweekly salary',
      isReconciled: false,
      isCleared: false,
      tags: ['income'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '4',
      accountId: '1',
      date: new Date(new Date().setDate(new Date().getDate() + 2)),
      payee: 'Electric Bill',
      amount: -95.20,
      type: 'expense' as const,
      categoryId: '4',
      description: 'Monthly utility bill',
      isReconciled: false,
      isCleared: false,
      tags: ['utilities'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '5',
      accountId: '1',
      date: new Date(new Date().setDate(new Date().getDate() + 3)),
      payee: 'Internet Service',
      amount: -65.99,
      type: 'expense' as const,
      categoryId: '4',
      description: 'Monthly internet',
      isReconciled: false,
      isCleared: false,
      tags: ['utilities'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  
  // Filter events for the selected date/range
  const filteredEvents = React.useMemo(() => {
    switch (viewMode) {
      case 'day':
        return financialEvents.filter(event => 
          moment(event.date).isSame(moment(selectedDate), 'day')
        );
      case 'week':
        const weekStart = moment(selectedDate).startOf('week');
        const weekEnd = moment(selectedDate).endOf('week');
        return financialEvents.filter(event => 
          moment(event.date).isBetween(weekStart, weekEnd, 'day', '[]')
        );
      case 'month':
        const monthStart = moment(selectedDate).startOf('month');
        const monthEnd = moment(selectedDate).endOf('month');
        return financialEvents.filter(event => 
          moment(event.date).isBetween(monthStart, monthEnd, 'day', '[]')
        );
      default:
        return financialEvents;
    }
  }, [financialEvents, selectedDate, viewMode]);
  
  // Calculate projected balance based on selected date
  const projectedBalance = React.useMemo(() => {
    const currentBalance = 5000; // This would come from user's accounts in a real app
    
    // Get all events up to the selected date
    const eventsUpToDate = financialEvents.filter(event => 
      new Date(event.date) <= selectedDate
    );
    
    // Sum up the amounts
    const balanceChange = eventsUpToDate.reduce(
      (sum, event) => sum + event.amount, 
      0
    );
    
    return currentBalance + balanceChange;
  }, [selectedDate, financialEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    // In a real app, you'd fetch updated events data here
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleEventPress = (event: Transaction | RecurringTransaction) => {
    // In a real app, navigate to event details
    console.log('Event pressed:', event.id);
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const generateCalendarDays = () => {
    const days = [];
    const startDate = moment(selectedDate).startOf('week');
    
    for (let i = 0; i < 7; i++) {
      const date = moment(startDate).add(i, 'days');
      const isSelected = date.isSame(moment(selectedDate), 'day');
      
      days.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.calendarDay,
            isSelected && styles.selectedCalendarDay,
          ]}
          onPress={() => setSelectedDate(date.toDate())}
        >
          <Text style={styles.calendarDayName}>
            {date.format('ddd')}
          </Text>
          <Text style={[
            styles.calendarDayNumber,
            isSelected && styles.selectedCalendarDayText,
          ]}>
            {date.format('D')}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return days;
  };

  const mockTransaction = {
    id: '123',
    accountId: 'acc123',
    date: new Date(),
    payee: 'Mock Payee',
    payeeId: 'payee123',
    amount: 100,
    type: 'expense' as TransactionType,
    categoryId: 'cat123',
    description: 'Monthly Subscription',
    isReconciled: false,
    isCleared: false,
    tags: ['subscription', 'monthly'],
    createdAt: new Date(),
    updatedAt: new Date(),
    isSplit: false,
    splits: undefined,
    recurrenceRule: {
      frequency: 'monthly',
      interval: 1,
      dayOfMonth: 1,
      endDate: null
    },
    isAutomatic: true
  } as RecurringTransaction;

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* View Mode Selector */}
      <View style={styles.viewSelector}>
        <TouchableOpacity
          style={[
            styles.viewOption,
            viewMode === 'day' && styles.selectedViewOption,
          ]}
          onPress={() => setViewMode('day')}
        >
          <Text style={[
            styles.viewOptionText,
            viewMode === 'day' && styles.selectedViewOptionText,
          ]}>
            Day
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.viewOption,
            viewMode === 'week' && styles.selectedViewOption,
          ]}
          onPress={() => setViewMode('week')}
        >
          <Text style={[
            styles.viewOptionText,
            viewMode === 'week' && styles.selectedViewOptionText,
          ]}>
            Week
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.viewOption,
            viewMode === 'month' && styles.selectedViewOption,
          ]}
          onPress={() => setViewMode('month')}
        >
          <Text style={[
            styles.viewOptionText,
            viewMode === 'month' && styles.selectedViewOptionText,
          ]}>
            Month
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <View style={styles.dateSelector}>
          <CalendarIcon size={18} color={theme.colors.primary} style={styles.calendarIcon} />
          
          <TouchableOpacity style={styles.dateSelectorButton}>
            <Text style={styles.selectedDateText}>
              {formatMonthYear(selectedDate)}
            </Text>
            <ChevronDown size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.dateNavigationButtons}>
          <TouchableOpacity 
            style={styles.dateNavButton}
            onPress={() => changeDate(-1)}
          >
            <Text style={styles.dateNavButtonText}>Previous</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.dateNavButton, styles.todayButton]}
            onPress={() => setSelectedDate(new Date())}
          >
            <Text style={[styles.dateNavButtonText, styles.todayButtonText]}>Today</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.dateNavButton}
            onPress={() => changeDate(1)}
          >
            <Text style={styles.dateNavButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Weekly Calendar (visible when in week view) */}
      {viewMode === 'week' && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.calendarStrip}
        >
          <View style={styles.calendarDaysContainer}>
            {generateCalendarDays()}
          </View>
        </ScrollView>
      )}
      
      {/* Projected Balance */}
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>
          Projected Balance {viewMode === 'day' ? `(${formatDate(selectedDate)})` : ''}
        </Text>
        <Text style={styles.balanceAmount}>
          {formatCurrency(projectedBalance)}
        </Text>
      </View>
      
      {/* Events List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.eventsContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
          />
        }
      >
        <Text style={styles.sectionTitle}>
          {viewMode === 'day' 
            ? `Events for ${formatDate(selectedDate)}` 
            : viewMode === 'week'
              ? 'This Week\'s Events'
              : `Events for ${formatMonthYear(selectedDate)}`
          }
        </Text>
        
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <CalendarEventItem 
              key={event.id}
              transaction={event}
              onPress={handleEventPress}
              isRecurring={false}
              isPast={new Date(event.date) < new Date()}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No events scheduled for this {viewMode}
            </Text>
          </View>
        )}
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Add Event Button */}
      <TouchableOpacity style={styles.addButton}>
        <Plus size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    padding: 8,
  },
  viewOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedViewOption: {
    backgroundColor: theme.colors.primary,
  },
  viewOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  selectedViewOptionText: {
    color: theme.colors.card,
  },
  calendarHeader: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarIcon: {
    marginRight: 8,
  },
  dateSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  dateNavigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateNavButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  dateNavButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  todayButton: {
    backgroundColor: theme.colors.primary,
  },
  todayButtonText: {
    color: theme.colors.card,
  },
  calendarStrip: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  calendarDaysContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  calendarDay: {
    width: 50,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  selectedCalendarDay: {
    backgroundColor: theme.colors.primary,
  },
  calendarDayName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  calendarDayNumber: {
    fontSize: 18,
    fontWeight: '600',
  },
  selectedCalendarDayText: {
    color: theme.colors.card,
  },
  balanceContainer: {
    backgroundColor: theme.colors.card,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  eventsContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 80,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});