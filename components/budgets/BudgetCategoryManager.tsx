import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import { useAppContext } from '@/context/AppContext';
import { BudgetCategory, BudgetCategoryGroup } from '@/types/budget';
import { v4 as uuidv4 } from 'uuid';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Theme } from '@/context/theme';

interface BudgetCategoryFormValues {
  id: string;
  name: string;
  allocated: string;
  groupId?: string;
}

interface BudgetGroupFormValues {
  id: string;
  name: string;
}

const BudgetCategoryManager: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [groups, setGroups] = useState<BudgetCategoryGroup[]>([]);
  
  // Form state
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<BudgetCategoryFormValues>({
    id: '',
    name: '',
    allocated: '0',
  });
  const [currentGroup, setCurrentGroup] = useState<BudgetGroupFormValues>({
    id: '',
    name: '',
  });

  // Extract categories from current budget
  useEffect(() => {
    // Get the active budget
    const activeBudget = state.budgets.find(budget => budget.isActive);
    
    if (activeBudget) {
      // Extract categories and groups
      const extractedCategories: BudgetCategory[] = [];
      const extractedGroups: BudgetCategoryGroup[] = [];
      
      const processCategories = (items: (BudgetCategory | BudgetCategoryGroup)[]) => {
        items.forEach(item => {
          if ('children' in item) {
            // This is a group
            extractedGroups.push(item);
            processCategories(item.children);
          } else {
            // This is a category
            extractedCategories.push(item);
          }
        });
      };
      
      processCategories(activeBudget.categories);
      
      setCategories(extractedCategories);
      setGroups(extractedGroups);
    }
  }, [state.budgets]);

  // Add or update category
  const handleSaveCategory = () => {
    if (!currentCategory.name.trim()) {
      Alert.alert('Error', 'Category name is required');
      return;
    }
    
    // Create category object
    const category: BudgetCategory = {
      id: currentCategory.id || uuidv4(),
      name: currentCategory.name.trim(),
      categoryId: currentCategory.id || uuidv4(), // Using same ID for both properties
      allocated: parseFloat(currentCategory.allocated) || 0,
      spent: 0,
      remaining: parseFloat(currentCategory.allocated) || 0,
      parentGroupId: currentCategory.groupId,
    };
    
    // Get active budget
    const activeBudget = state.budgets.find(budget => budget.isActive);
    
    if (!activeBudget) {
      Alert.alert('Error', 'No active budget found');
      return;
    }
    
    // Update budget structure
    let updatedCategories = [...activeBudget.categories];
    
    if (editMode) {
      // Update existing category
      updatedCategories = updateCategoryInStructure(
        updatedCategories,
        category
      );
    } else {
      // Add new category
      if (category.parentGroupId) {
        // Add to specified group
        updatedCategories = addCategoryToGroup(
          updatedCategories, 
          category, 
          category.parentGroupId
        );
      } else {
        // Add to root level
        updatedCategories.push(category);
      }
    }
    
    // Update budget
    const updatedBudget = {
      ...activeBudget,
      categories: updatedCategories,
      updatedAt: new Date()
    };
    
    dispatch({
      type: 'UPDATE_BUDGET',
      payload: updatedBudget
    });
    
    // Reset form and close modal
    setCurrentCategory({
      id: '',
      name: '',
      allocated: '0',
    });
    setCategoryModalVisible(false);
    setEditMode(false);
  };

  // Add or update group
  const handleSaveGroup = () => {
    if (!currentGroup.name.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }
    
    // Create group object
    const group: BudgetCategoryGroup = {
      id: currentGroup.id || uuidv4(),
      name: currentGroup.name.trim(),
      children: []
    };
    
    // Get active budget
    const activeBudget = state.budgets.find(budget => budget.isActive);
    
    if (!activeBudget) {
      Alert.alert('Error', 'No active budget found');
      return;
    }
    
    // Update budget structure
    let updatedCategories = [...activeBudget.categories];
    
    if (editMode) {
      // Update existing group
      updatedCategories = updateGroupInStructure(
        updatedCategories,
        group
      );
    } else {
      // Add new group at root level
      updatedCategories.push(group);
    }
    
    // Update budget
    const updatedBudget = {
      ...activeBudget,
      categories: updatedCategories,
      updatedAt: new Date()
    };
    
    dispatch({
      type: 'UPDATE_BUDGET',
      payload: updatedBudget
    });
    
    // Reset form and close modal
    setCurrentGroup({
      id: '',
      name: '',
    });
    setGroupModalVisible(false);
    setEditMode(false);
  };

  // Delete category
  const handleDeleteCategory = (categoryId: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Get active budget
            const activeBudget = state.budgets.find(budget => budget.isActive);
            
            if (!activeBudget) {
              Alert.alert('Error', 'No active budget found');
              return;
            }
            
            // Remove category from structure
            const updatedCategories = removeCategoryFromStructure(
              [...activeBudget.categories],
              categoryId
            );
            
            // Update budget
            const updatedBudget = {
              ...activeBudget,
              categories: updatedCategories,
              updatedAt: new Date()
            };
            
            dispatch({
              type: 'UPDATE_BUDGET',
              payload: updatedBudget
            });
          }
        }
      ]
    );
  };

  // Delete group
  const handleDeleteGroup = (groupId: string) => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? All categories within this group will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Get active budget
            const activeBudget = state.budgets.find(budget => budget.isActive);
            
            if (!activeBudget) {
              Alert.alert('Error', 'No active budget found');
              return;
            }
            
            // Remove group from structure
            const updatedCategories = removeGroupFromStructure(
              [...activeBudget.categories],
              groupId
            );
            
            // Update budget
            const updatedBudget = {
              ...activeBudget,
              categories: updatedCategories,
              updatedAt: new Date()
            };
            
            dispatch({
              type: 'UPDATE_BUDGET',
              payload: updatedBudget
            });
          }
        }
      ]
    );
  };

  // Helper functions for manipulating the budget category structure
  const addCategoryToGroup = (
    categories: (BudgetCategory | BudgetCategoryGroup)[],
    category: BudgetCategory,
    groupId: string
  ): (BudgetCategory | BudgetCategoryGroup)[] => {
    return categories.map(item => {
      if ('children' in item && item.id === groupId) {
        // Found the target group, add the category to its children
        return {
          ...item,
          children: [...item.children, category]
        };
      } else if ('children' in item) {
        // Check in nested groups
        return {
          ...item,
          children: addCategoryToGroup(item.children, category, groupId)
        };
      }
      return item;
    });
  };

  const updateCategoryInStructure = (
    categories: (BudgetCategory | BudgetCategoryGroup)[],
    updatedCategory: BudgetCategory
  ): (BudgetCategory | BudgetCategoryGroup)[] => {
    return categories.map(item => {
      if (!('children' in item) && item.id === updatedCategory.id) {
        // Found the category to update
        return updatedCategory;
      } else if ('children' in item) {
        // Check in nested groups
        return {
          ...item,
          children: updateCategoryInStructure(item.children, updatedCategory)
        };
      }
      return item;
    });
  };

  const updateGroupInStructure = (
    categories: (BudgetCategory | BudgetCategoryGroup)[],
    updatedGroup: BudgetCategoryGroup
  ): (BudgetCategory | BudgetCategoryGroup)[] => {
    return categories.map(item => {
      if ('children' in item && item.id === updatedGroup.id) {
        // Found the group to update, preserve its children
        return {
          ...updatedGroup,
          children: item.children
        };
      } else if ('children' in item) {
        // Check in nested groups
        return {
          ...item,
          children: updateGroupInStructure(item.children, updatedGroup)
        };
      }
      return item;
    });
  };

  const removeCategoryFromStructure = (
    categories: (BudgetCategory | BudgetCategoryGroup)[],
    categoryId: string
  ): (BudgetCategory | BudgetCategoryGroup)[] => {
    const result: (BudgetCategory | BudgetCategoryGroup)[] = [];
    
    for (const item of categories) {
      if (!('children' in item) && item.id === categoryId) {
        // Skip this item (remove it)
        continue;
      } else if ('children' in item) {
        // Process group
        const updatedChildren = removeCategoryFromStructure(item.children, categoryId);
        result.push({
          ...item,
          children: updatedChildren
        });
      } else {
        // Keep this item
        result.push(item);
      }
    }
    
    return result;
  };

  const removeGroupFromStructure = (
    categories: (BudgetCategory | BudgetCategoryGroup)[],
    groupId: string
  ): (BudgetCategory | BudgetCategoryGroup)[] => {
    const result: (BudgetCategory | BudgetCategoryGroup)[] = [];
    
    for (const item of categories) {
      if ('children' in item && item.id === groupId) {
        // Skip this group (remove it)
        continue;
      } else if ('children' in item) {
        // Process nested groups
        const updatedChildren = removeGroupFromStructure(item.children, groupId);
        result.push({
          ...item,
          children: updatedChildren
        });
      } else {
        // Keep this category
        result.push(item);
      }
    }
    
    return result;
  };

  // Edit category
  const handleEditCategory = (category: BudgetCategory) => {
    setCurrentCategory({
      id: category.id,
      name: category.name,
      allocated: category.allocated.toString(),
      groupId: category.parentGroupId
    });
    setEditMode(true);
    setCategoryModalVisible(true);
  };

  // Edit group
  const handleEditGroup = (group: BudgetCategoryGroup) => {
    setCurrentGroup({
      id: group.id,
      name: group.name
    });
    setEditMode(true);
    setGroupModalVisible(true);
  };

  // Render category/group item
  const renderCategoryItem = ({ item }: { item: BudgetCategory | BudgetCategoryGroup }) => {
    const isGroup = 'children' in item;
    
    return (
      <View style={[styles.itemContainer, isGroup && styles.groupContainer]}>
        <View style={styles.itemContent}>
          {isGroup ? (
            <Text style={styles.groupName}>{item.name}</Text>
          ) : (
            <View style={styles.categoryRow}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.allocatedAmount}>${(item as BudgetCategory).allocated.toFixed(2)}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              if (isGroup) {
                handleEditGroup(item as BudgetCategoryGroup);
              } else {
                handleEditCategory(item as BudgetCategory);
              }
            }}
          >
            <Ionicons name="pencil" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              if (isGroup) {
                handleDeleteGroup(item.id);
              } else {
                handleDeleteCategory(item.id);
              }
            }}
          >
            <Ionicons name="trash" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render flat hierarchy for display
  const renderFlatHierarchy = () => {
    const flatItems: (BudgetCategory | BudgetCategoryGroup)[] = [];
    
    const flattenHierarchy = (
      items: (BudgetCategory | BudgetCategoryGroup)[], 
      level = 0
    ) => {
      items.forEach(item => {
        flatItems.push(item);
        
        if ('children' in item && item.children.length > 0) {
          flattenHierarchy(item.children, level + 1);
        }
      });
    };
    
    // Get active budget
    const activeBudget = state.budgets.find(budget => budget.isActive);
    
    if (activeBudget) {
      flattenHierarchy(activeBudget.categories);
    }
    
    return (
      <FlatList
        data={flatItems}
        renderItem={renderCategoryItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Budget Categories</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => {
              setEditMode(false);
              setCurrentCategory({
                id: '',
                name: '',
                allocated: '0',
              });
              setCategoryModalVisible(true);
            }}
          >
            <Ionicons name="add-circle" size={20} color={theme.colors.card} />
            <Text style={styles.buttonText}>Add Category</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.addButton, styles.groupButton]}
            onPress={() => {
              setEditMode(false);
              setCurrentGroup({
                id: '',
                name: '',
              });
              setGroupModalVisible(true);
            }}
          >
            <Ionicons name="folder-open" size={20} color={theme.colors.card} />
            <Text style={styles.buttonText}>Add Group</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Category list */}
      {renderFlatHierarchy()}
      
      {/* Category Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={categoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editMode ? 'Edit Category' : 'Add New Category'}
            </Text>
            
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={currentCategory.name}
              onChangeText={(text) => setCurrentCategory({...currentCategory, name: text})}
              placeholder="Category Name"
            />
            
            <Text style={styles.fieldLabel}>Allocated Amount</Text>
            <TextInput
              style={styles.input}
              value={currentCategory.allocated}
              onChangeText={(text) => {
                // Only allow numeric input with decimals
                if (/^\d*\.?\d*$/.test(text)) {
                  setCurrentCategory({...currentCategory, allocated: text});
                }
              }}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
            
            <Text style={styles.fieldLabel}>Group (Optional)</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => {
                  // Reset group selection
                  setCurrentCategory({...currentCategory, groupId: undefined});
                }}
              >
                <Text style={styles.pickerText}>
                  {!currentCategory.groupId ? '✓ None (Root Level)' : 'None (Root Level)'}
                </Text>
              </TouchableOpacity>
              
              {groups.map(group => (
                <TouchableOpacity
                  key={group.id}
                  style={styles.picker}
                  onPress={() => {
                    setCurrentCategory({...currentCategory, groupId: group.id});
                  }}
                >
                  <Text style={styles.pickerText}>
                    {currentCategory.groupId === group.id ? `✓ ${group.name}` : group.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCategoryModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveCategory}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Group Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={groupModalVisible}
        onRequestClose={() => setGroupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editMode ? 'Edit Group' : 'Add New Group'}
            </Text>
            
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={currentGroup.name}
              onChangeText={(text) => setCurrentGroup({...currentGroup, name: text})}
              placeholder="Group Name"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setGroupModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveGroup}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#212121',
  },
  headerButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 12,
  },
  groupButton: {
    backgroundColor: theme.colors.secondary,
  },
  buttonText: {
    color: theme.colors.card,
    marginLeft: 6,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupContainer: {
    backgroundColor: '#f0f0f0',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
  },
  itemContent: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  categoryName: {
    fontSize: 15,
    color: '#212121',
  },
  allocatedAmount: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#212121',
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  picker: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerText: {
    fontSize: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  saveButtonText: {
    color: theme.colors.card,
    fontWeight: '500',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#f1f1f1',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default BudgetCategoryManager;