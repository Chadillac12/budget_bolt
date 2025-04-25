import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Account } from '@/types/account';
import { formatCurrency } from '@/utils/dateUtils';
import { Eye, EyeOff, CreditCard, DollarSign, Briefcase, Wallet, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import AccountClassificationForm from './AccountClassificationForm';
import { ThemedCard, ThemedText } from '@/components/themed';
import { useAppTheme } from '@/hooks/useAppTheme';

interface AccountCardProps {
  account: Account;
  onPress: (account: Account) => void;
}

export default function AccountCard({ account, onPress }: AccountCardProps) {
  const { dispatch } = useAppContext();
  const theme = useAppTheme();
  const [showClassificationForm, setShowClassificationForm] = useState(false);
  
  const toggleVisibility = () => {
    dispatch({
      type: 'UPDATE_ACCOUNT',
      payload: {
        ...account,
        isHidden: !account.isHidden,
        updatedAt: new Date(),
      },
    });
  };
  
  const getAccountIcon = () => {
    const color = account.color || theme.colors.primary;
    
    switch (account.type) {
      case 'checking':
        return <DollarSign size={24} color={color} />;
      case 'savings':
        return <Wallet size={24} color={color} />;
      case 'credit':
        return <CreditCard size={24} color={color} />;
      case 'investment':
        return <Briefcase size={24} color={color} />;
      default:
        return <DollarSign size={24} color={color} />;
    }
  };

  return (
    <>
      <AccountClassificationForm
        account={account}
        isVisible={showClassificationForm}
        onClose={() => setShowClassificationForm(false)}
      />
      
      <ThemedCard 
        borderLeftColor={account.color || theme.colors.primary}
        style={styles.card}
        onPress={() => onPress(account)}
      >
        <View style={styles.leftContent}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.background }]}>
            {getAccountIcon()}
          </View>
          <View style={styles.accountInfo}>
            <ThemedText variant="subtitle" style={styles.accountName}>
              {account.name}
            </ThemedText>
            <View style={styles.accountMetaRow}>
              <ThemedText 
                variant="caption" 
                color={theme.colors.textSecondary}
                style={styles.accountType}
              >
                {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowClassificationForm(true)}
              >
                <View style={[
                  styles.classificationBadge,
                  account.classification === 'asset' ? styles.assetBadge : styles.liabilityBadge,
                  account.excludeFromNetWorth && styles.excludedBadge,
                  { 
                    backgroundColor: account.classification === 'asset' 
                      ? theme.colors.success 
                      : account.excludeFromNetWorth 
                        ? theme.colors.textSecondary 
                        : theme.colors.error
                  }
                ]}>
                  {account.classification === 'asset' ? (
                    <TrendingUp size={12} color="#fff" />
                  ) : (
                    <TrendingDown size={12} color="#fff" />
                  )}
                  <ThemedText style={styles.classificationText} color="#fff">
                    {account.excludeFromNetWorth ? 'Excluded' : account.classification.charAt(0).toUpperCase() + account.classification.slice(1)}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View style={styles.rightContent}>
          <ThemedText 
            variant="subtitle" 
            style={styles.balance}
            color={account.balance < 0 ? theme.colors.error : theme.colors.text}
          >
            {account.isHidden ? '••••••' : formatCurrency(account.balance, account.currency)}
          </ThemedText>
          
          <TouchableOpacity 
            style={styles.visibilityButton}
            onPress={toggleVisibility}
          >
            {account.isHidden ? (
              <EyeOff size={18} color={theme.colors.textSecondary} />
            ) : (
              <Eye size={18} color={theme.colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>
      </ThemedCard>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountInfo: {
    justifyContent: 'center',
  },
  accountName: {
    fontWeight: '600',
  },
  accountMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  accountType: {
    marginRight: 8,
  },
  classificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  assetBadge: {},
  liabilityBadge: {},
  excludedBadge: {},
  classificationText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  balance: {
    fontWeight: '600',
  },
  visibilityButton: {
    marginTop: 4,
    padding: 4,
  },
});