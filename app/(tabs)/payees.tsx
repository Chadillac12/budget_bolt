import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useAppContext } from '@/context/AppContext';
import { Payee, PayeeCategory } from '@/types/payee';
import PayeeItem from '@/components/payees/PayeeItem';
import PayeeForm from '@/components/payees/PayeeForm';
import PayeeAnalytics from '@/components/payees/PayeeAnalytics';
import PayeeCategoryForm from '@/components/payees/PayeeCategoryForm';
import { Transaction } from '@/types/transaction';
import { calculatePayeeAnalytics } from '@/utils/payeeUtils';
import { Plus, Search, Filter, Tag, ArrowLeft, BarChart3 } from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';

/**
 * Payee Management Screen
 * Allows users to view, create, edit, and delete payees
 */
export default function PayeesScreen() {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { state, dispatch } = useAppContext();
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [showPayeeForm, setShowPayeeForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [editingPayee, setEditingPayee] = useState<Payee | undefined>(undefined);
  const [editingCategory, setEditingCategory] = useState<PayeeCategory | undefined>(undefined);
  const [selectedPayee, setSelectedPayee] = useState<Payee | undefined>(undefined);
  const [payeeTransactions, setPayeeTransactions] = useState<Transaction[]>([]);
  
  // Filter payees based on search query, active status, and selected categories
  const filteredPayees = state.payees.filter(payee => {
    // Filter by search query
    const matchesSearch = 
      searchQuery === '' || 
      payee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payee.alias && payee.alias.some(alias => 
        alias.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    
    // Filter by active status
    const matchesActiveFilter = !showActiveOnly || payee.isActive;
    
    // Filter by selected categories
    const matchesCategories = 
      selectedCategoryIds.length === 0 || 
      selectedCategoryIds.some(id => payee.categoryIds.includes(id));
    
    return matchesSearch && matchesActiveFilter && matchesCategories;
  });
  
  // Sort payees by name
  const sortedPayees = [...filteredPayees].sort((a, b) => 
    a.name.localeCompare(b.name)
  );
  
  // Handle adding a new payee
  const handleAddPayee = () => {
    setEditingPayee(undefined);
    setShowPayeeForm(true);
  };
  
  // Handle editing a payee
  const handleEditPayee = (payee: Payee) => {
    setEditingPayee(payee);
    setShowPayeeForm(true);
  };
  
  // Handle deleting a payee
  const handleDeletePayee = (payee: Payee) => {
    Alert.alert(
      'Delete Payee',
      `Are you sure you want to delete ${payee.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch({
              type: 'DELETE_PAYEE',
              payload: payee.id
            });
          }
        }
      ]
    );
  };
  
  // Handle saving a payee
  const handleSavePayee = (payee: Payee) => {
    if (editingPayee) {
      dispatch({
        type: 'UPDATE_PAYEE',
        payload: payee
      });
    } else {
      dispatch({
        type: 'ADD_PAYEE',
        payload: payee
      });
    }
    
    setShowPayeeForm(false);
  };
  
  // Handle adding a new category
  const handleAddCategory = () => {
    setEditingCategory(undefined);
    setShowCategoryForm(true);
  };
  
  // Handle editing a category
  const handleEditCategory = (category: PayeeCategory) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };
  
  // Handle saving a category
  const handleSaveCategory = (category: PayeeCategory) => {
    if (editingCategory) {
      dispatch({
        type: 'UPDATE_PAYEE_CATEGORY',
        payload: category
      });
    } else {
      dispatch({
        type: 'ADD_PAYEE_CATEGORY',
        payload: category
      });
    }
    
    setShowCategoryForm(false);
  };
  
  // Handle deleting a category
  const handleDeleteCategory = (category: PayeeCategory) => {
    // Check if any payees are using this category
    const payeesUsingCategory = state.payees.filter(
      payee => payee.categoryIds.includes(category.id)
    );
    
    if (payeesUsingCategory.length > 0) {
      Alert.alert(
        'Category In Use',
        `This category is used by ${payeesUsingCategory.length} payees. Remove it from all payees first.`
      );
      return;
    }
    
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete the "${category.name}" category?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch({
              type: 'DELETE_PAYEE_CATEGORY',
              payload: category.id
            });
            
            // Remove this category from selected categories if it's selected
            if (selectedCategoryIds.includes(category.id)) {
              setSelectedCategoryIds(
                selectedCategoryIds.filter(id => id !== category.id)
              );
            }
          }
        }
      ]
    );
  };
  
  // Toggle category selection for filtering
  const handleToggleCategory = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== categoryId));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, categoryId]);
    }
  };
  
  // View transactions for a payee
  const handleViewTransactions = (payee: Payee) => {
    setSelectedPayee(payee);
    
    // Get transactions for this payee
    const transactions = state.transactions.filter(t => 
      t.payeeId === payee.id || 
      (!t.payeeId && t.payee.toLowerCase() === payee.name.toLowerCase())
    );
    
    setPayeeTransactions(transactions);
    setShowTransactions(true);
  };
  
  // View analytics for a payee
  const handleViewAnalytics = (payee: Payee) => {
    setSelectedPayee(payee);
    setShowAnalytics(true);
  };
  
  // Render a payee item
  const renderPayeeItem = ({ item }: { item: Payee }) => (
    <PayeeItem
      payee={item}
      onEdit={handleEditPayee}
      onDelete={handleDeletePayee}
      onViewTransactions={() => handleViewAnalytics(item)}
    />
  );
  
  // Render a category item for the filter
  const renderCategoryFilter = ({ item }: { item: PayeeCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryFilterItem,
        selectedCategoryIds.includes(item.id) && styles.selectedCategoryFilterItem,
        { borderColor: item.color || theme.colors.border }
      ]}
      onPress={() => handleToggleCategory(item.id)}
    >
      <View 
        style={[
          styles.categoryIndicator, 
          { backgroundColor: item.color || theme.colors.border }
        ]}
      />
      <Text style={styles.categoryFilterText}>{item.name}</Text>
    </TouchableOpacity>
  );
  
  // Render a category item for management
  const renderCategoryItem = ({ item }: { item: PayeeCategory }) => (
    <View style={styles.categoryItem}>
      <View 
        style={[
          styles.categoryColorIndicator, 
          { backgroundColor: item.color || theme.colors.border }
        ]}
      />
      <Text style={styles.categoryName}>{item.name}</Text>
      
      <View style={styles.categoryActions}>
        <TouchableOpacity
          style={styles.categoryAction}
          onPress={() => handleEditCategory(item)}
        >
          <Text style={styles.categoryActionText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.categoryAction, styles.categoryDeleteAction]}
          onPress={() => handleDeleteCategory(item)}
        >
          <Text style={styles.categoryDeleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payees</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={handleAddPayee}
          >
            <Plus size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search payees"
            clearButtonMode="while-editing"
          />
        </View>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            showActiveOnly && styles.activeFilterButton
          ]}
          onPress={() => setShowActiveOnly(!showActiveOnly)}
        >
          <Filter size={20} color={showActiveOnly ? theme.colors.card : theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      {/* Category Filters */}
      {state.payeeCategories.length > 0 && (
        <FlatList
          data={state.payeeCategories}
          renderItem={renderCategoryFilter}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilterList}
          contentContainerStyle={styles.categoryFilterContent}
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.manageCategoriesButton}
              onPress={handleAddCategory}
            >
              <Tag size={16} color={theme.colors.primary} style={styles.manageCategoriesIcon} />
              <Text style={styles.manageCategoriesText}>Manage</Text>
            </TouchableOpacity>
          }
        />
      )}
      
      {/* Payee List */}
      {state.payees.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No payees yet. Add your first payee to get started.
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={handleAddPayee}
          >
            <Plus size={20} color={theme.colors.card} style={styles.emptyStateButtonIcon} />
            <Text style={styles.emptyStateButtonText}>Add Payee</Text>
          </TouchableOpacity>
        </View>
      ) : sortedPayees.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No payees match your filters.
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => {
              setSearchQuery('');
              setShowActiveOnly(true);
              setSelectedCategoryIds([]);
            }}
          >
            <Text style={styles.emptyStateButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sortedPayees}
          renderItem={renderPayeeItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.payeeListContent}
        />
      )}
      
      {/* Payee Form Modal */}
      <Modal
        visible={showPayeeForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPayeeForm(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <PayeeForm
              payee={editingPayee}
              onSave={handleSavePayee}
              onCancel={() => setShowPayeeForm(false)}
            />
          </View>
        </View>
      </Modal>
      
      {/* Category Form Modal */}
      <Modal
        visible={showCategoryForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryForm(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <PayeeCategoryForm
              category={editingCategory}
              onSave={handleSaveCategory}
              onCancel={() => setShowCategoryForm(false)}
            />
          </View>
        </View>
      </Modal>
      
      {/* Analytics Modal */}
      <Modal
        visible={showAnalytics}
        animationType="slide"
        onRequestClose={() => setShowAnalytics(false)}
      >
        <View style={styles.fullScreenModal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowAnalytics(false)}
            >
              <ArrowLeft size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Payee Analytics</Text>
          </View>
          
          {selectedPayee && (
            <PayeeAnalytics payee={selectedPayee} />
          )}
        </View>
      </Modal>
      
      {/* Transactions Modal */}
      <Modal
        visible={showTransactions}
        animationType="slide"
        onRequestClose={() => setShowTransactions(false)}
      >
        <View style={styles.fullScreenModal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowTransactions(false)}
            >
              <ArrowLeft size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Transactions</Text>
            
            {selectedPayee && (
              <TouchableOpacity
                style={styles.analyticsButton}
                onPress={() => {
                  setShowTransactions(false);
                  setShowAnalytics(true);
                }}
              >
                <BarChart3 size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          
          {payeeTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No transactions found for this payee.
              </Text>
            </View>
          ) : (
            <FlatList
              data={payeeTransactions}
              renderItem={({ item }) => (
                <View style={styles.transactionItem}>
                  <Text style={styles.transactionDate}>
                    {item.date.toLocaleDateString()}
                  </Text>
                  <Text style={styles.transactionDescription}>
                    {item.description || 'No description'}
                  </Text>
                  <Text 
                    style={[
                      styles.transactionAmount,
                      item.type === 'expense' ? styles.expenseText : styles.incomeText
                    ]}
                  >
                    {item.type === 'expense' ? '-' : '+'}
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(item.amount)}
                  </Text>
                </View>
              )}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.transactionListContent}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerAction: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: theme.colors.primary,
  },
  categoryFilterList: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  selectedCategoryFilterItem: {
    backgroundColor: theme.colors.surface,
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  categoryFilterText: {
    fontSize: 14,
  },
  manageCategoriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 12,
  },
  manageCategoriesIcon: {
    marginRight: 4,
  },
  manageCategoriesText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  payeeListContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyStateButtonIcon: {
    marginRight: 8,
  },
  emptyStateButtonText: {
    color: theme.colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: theme.colors.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  analyticsButton: {
    padding: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoryColorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    flex: 1,
  },
  categoryActions: {
    flexDirection: 'row',
  },
  categoryAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: theme.colors.surface,
    marginLeft: 8,
  },
  categoryActionText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryDeleteAction: {
    backgroundColor: '#FFE5E5',
  },
  categoryDeleteText: {
    color: theme.colors.error,
    fontSize: 14,
    fontWeight: '500',
  },
  transactionItem: {
    backgroundColor: theme.colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  transactionDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 16,
    marginBottom: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  expenseText: {
    color: theme.colors.error,
  },
  incomeText: {
    color: theme.colors.success,
  },
  transactionListContent: {
    paddingBottom: 16,
  },
});