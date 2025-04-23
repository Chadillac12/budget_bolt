# Account Management

The Account Management system in Budget Bolt allows users to track and organize all their financial accounts in one place, providing a comprehensive view of their financial situation.

## Overview

Account Management is a core feature of Budget Bolt that enables users to:
- Add, modify, and organize multiple financial accounts
- Track real-time balances across different account types
- Assign meaningful nicknames and colors to accounts
- Classify accounts for net worth calculations

## Account Types

Budget Bolt supports the following account types:

| Account Type | Description | Default Classification |
|-------------|-------------|------------------------|
| Checking    | Day-to-day transaction accounts | Asset |
| Savings     | Interest-bearing deposit accounts | Asset |
| Credit      | Credit cards and lines of credit | Liability |
| Investment  | Brokerage, retirement, and other investment accounts | Asset |
| Loan        | Mortgages, student loans, and other debt | Liability |
| Cash        | Physical currency and cash holdings | Asset |
| Other       | Miscellaneous accounts that don't fit other categories | Asset |

## Account Properties

Each account in Budget Bolt has the following properties:

- **Name**: A user-defined name for the account
- **Type**: The account type (from the list above)
- **Balance**: The current balance of the account
- **Currency**: The currency used for the account
- **Color**: A user-selected color for visual identification
- **Icon**: A visual representation of the account type
- **Classification**: Whether the account is an asset or liability
- **Visibility Options**:
  - **Hidden**: Accounts can be hidden from regular views while still included in totals
  - **Archived**: Inactive accounts can be archived to reduce clutter
  - **Exclude from Net Worth**: Option to exclude specific accounts from net worth calculations

## Account Management Interface

### Account Dashboard

The Account Dashboard provides an overview of all accounts, showing:
- Current balance for each account
- Total balance across all accounts
- Recent transactions
- Quick access to account actions

### Adding a New Account

To add a new account:

1. Navigate to the Accounts section
2. Click the "Add Account" button
3. Enter the account details:
   - Name
   - Type
   - Starting balance
   - Currency
   - Color (optional)
   - Classification (auto-selected based on type, but can be changed)
4. Choose visibility options
5. Save the account

### Editing an Account

To edit an existing account:

1. Navigate to the Accounts section
2. Select the account to edit
3. Click the "Edit" button
4. Modify any account details
5. Save the changes

### Account Classification

Accounts are classified as either assets or liabilities for net worth calculations:

- **Assets**: Accounts with positive value (checking, savings, investments)
- **Liabilities**: Accounts with negative value (credit cards, loans)

The default classification is determined by the account type but can be manually adjusted if needed.

## Account Balances

Account balances are updated in real-time as transactions are added, edited, or deleted. The balance calculation includes:

- Starting balance
- Sum of all cleared transactions
- Sum of all uncleared transactions (shown separately)

### Balance Reconciliation

Account balances can be reconciled with official statements using the [[account-reconciliation|Account Reconciliation]] feature, which helps ensure accuracy in your financial tracking.

## Integration with Other Features

Account Management integrates with several other Budget Bolt features:

- **[[transaction-management|Transaction Management]]**: All transactions are associated with specific accounts
- **[[net-worth|Net Worth Tracking]]**: Account balances contribute to net worth calculations
- **[[financial-calendar|Financial Calendar]]**: Scheduled transactions affect projected account balances
- **[[dashboard|Customizable Dashboard]]**: Account summary cards can be added to the dashboard
- **[[data-import-export|Data Import/Export]]**: Transaction data can be imported into specific accounts
- **[[bank-api|Bank API Integration]]**: Accounts can be connected to financial institutions for automatic updates

## Best Practices

For effective account management in Budget Bolt:

1. **Create accounts for all financial instruments** you want to track
2. **Use consistent naming conventions** for easier identification
3. **Assign distinctive colors** to different account types
4. **Reconcile accounts regularly** to ensure accuracy
5. **Archive old accounts** rather than deleting them to preserve historical data
6. **Group related accounts** (e.g., all accounts at the same bank) for better organization

## Limitations and Planned Enhancements

Current limitations of the Account Management system:

- Limited support for investment account details (individual holdings, performance)
- Basic multi-currency support without automatic exchange rate updates

Planned enhancements:

- Enhanced visualization of account relationships
- More robust account classification hierarchy
- Improved investment account tracking
- Automatic currency conversion with up-to-date exchange rates
- Account groups for better organization

## Troubleshooting

Common issues with account management:

- **Balance discrepancies**: Usually resolved through [[account-reconciliation|account reconciliation]]
- **Missing transactions**: Check for transactions with incorrect account assignments
- **Duplicate accounts**: Can be merged through the account settings

---

**Next**: [[budget-interface|Budget and Category Interface]] | [[../project-overview/features-summary|Back to Features Summary]] | [[../README|Back to Main Documentation]]