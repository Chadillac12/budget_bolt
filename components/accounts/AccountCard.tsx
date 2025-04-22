import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Account, AccountClassification } from '@/types/account';
import { formatCurrency } from '@/utils/dateUtils';
import { Eye, EyeOff, CreditCard, DollarSign, Briefcase, Wallet, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import AccountClassificationForm from './AccountClassificationForm';

interface AccountCardProps {
  account: Account;
  onPress: (account: Account) => void;
}

export default function AccountCard({ account, onPress }: AccountCardProps) {
  const { dispatch } = useAppContext();
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
    switch (account.type) {
      case 'checking':
        return <DollarSign size={24} color={account.color || '#007AFF'} />;
      case 'savings':
        return <Wallet size={24} color={account.color || '#5856D6'} />;
      case 'credit':
        return <CreditCard size={24} color={account.color || '#FF2D55'} />;
      case 'investment':
        return <Briefcase size={24} color={account.color || '#34C759'} />;
      default:
        return <DollarSign size={24} color={account.color || '#007AFF'} />;
    }
  };

  return (
    <>
      <AccountClassificationForm
        account={account}
        isVisible={showClassificationForm}
        onClose={() => setShowClassificationForm(false)}
      />
      
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: account.color || '#007AFF' }]}
        onPress={() => onPress(account)}
        activeOpacity={0.7}
      >
      <View style={styles.leftContent}>
        <View style={styles.iconContainer}>
          {getAccountIcon()}
        </View>
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{account.name}</Text>
          <View style={styles.accountMetaRow}>
            <Text style={styles.accountType}>
              {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
            </Text>
            <TouchableOpacity
              onPress={() => setShowClassificationForm(true)}
            >
              <View style={[
                styles.classificationBadge,
                account.classification === 'asset' ? styles.assetBadge : styles.liabilityBadge,
                account.excludeFromNetWorth && styles.excludedBadge
              ]}>
                {account.classification === 'asset' ? (
                  <TrendingUp size={12} color="#fff" />
                ) : (
                  <TrendingDown size={12} color="#fff" />
                )}
                <Text style={styles.classificationText}>
                  {account.excludeFromNetWorth ? 'Excluded' : account.classification.charAt(0).toUpperCase() + account.classification.slice(1)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <View style={styles.rightContent}>
        <Text style={[
          styles.balance, 
          account.balance < 0 ? styles.negativeBalance : null
        ]}>
          {account.isHidden ? '••••••' : formatCurrency(account.balance, account.currency)}
        </Text>
        
        <TouchableOpacity 
          style={styles.visibilityButton}
          onPress={toggleVisibility}
        >
          {account.isHidden ? (
            <EyeOff size={18} color="#8E8E93" />
          ) : (
            <Eye size={18} color="#8E8E93" />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountInfo: {
    justifyContent: 'center',
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  accountMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  accountType: {
    fontSize: 13,
    color: '#8E8E93',
    marginRight: 8,
  },
  classificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  assetBadge: {
    backgroundColor: '#34C759',
  },
  liabilityBadge: {
    backgroundColor: '#FF3B30',
  },
  excludedBadge: {
    backgroundColor: '#8E8E93',
  },
  classificationText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 2,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  negativeBalance: {
    color: '#FF3B30',
  },
  visibilityButton: {
    marginTop: 4,
    padding: 4,
  },
});