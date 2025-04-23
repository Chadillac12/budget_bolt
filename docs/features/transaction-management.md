# Transaction Management

Transaction Management is a fundamental feature of Budget Bolt that allows users to record, categorize, and track all financial transactions across their accounts.

## Overview

The Transaction Management system in Budget Bolt provides comprehensive tools for:
- Recording income and expenses
- Categorizing transactions
- Splitting transactions across multiple categories
- Searching and filtering transaction history
- Managing recurring transactions
- Reconciling transactions with bank statements

## Transaction Types

Budget Bolt supports three primary transaction types:

1. **Income**: Money coming into your accounts (salary, gifts, interest, etc.)
2. **Expense**: Money going out of your accounts (bills, purchases, fees, etc.)
3. **Transfer**: Money moving between your accounts (no net change in overall balance)

## Transaction Properties

Each transaction in Budget Bolt has the following properties:

- **Account**: The account associated with the transaction
- **Date**: When the transaction occurred
- **Payee**: The person or entity involved in the transaction
- **Amount**: The monetary value of the transaction
- **Type**: Income, expense, or transfer
- **Category**: The budget category for the transaction
- **Description**: Additional details about the transaction
- **Status**: Cleared or uncleared
- **Reconciliation Status**: Whether the transaction has been reconciled
- **Tags**: Optional labels for additional organization
- **Split Information**: For transactions split across multiple categories

## Transaction Entry

### Adding a New Transaction

To add a new transaction:

1. Navigate to the Transactions section or the relevant account
2. Click the "Add Transaction" button
3. Enter the transaction details:
   - Select the account
   - Enter the date
   - Select or enter the payee
   - Enter the amount
   - Select the transaction type
   - Choose a category
   - Add a description (optional)
   - Add tags (optional)
4. For split transactions, click "Split" and allocate amounts to different categories
5. Save the transaction

### Quick Entry Options

Budget Bolt provides several options for efficient transaction entry:

- **Quick Add**: Simplified form for rapid entry of basic transactions
- **Duplicate**: Create a new transaction based on an existing one
- **Bulk Import**: Import multiple transactions from files (see [[data-import-export|Data Import/Export]])
- **Recurring Setup**: Create a template for transactions that repeat regularly

## Split Transactions

Split transactions allow users to allocate a single transaction across multiple budget categories.

### Creating a Split Transaction

To create a split transaction:

1. Start a new transaction or edit an existing one
2. Click the "Split" button
3. For each split:
   - Select a category
   - Enter the amount
   - Add a description (optional)
4. Continue adding splits until the full transaction amount is allocated
5. Save the transaction

### Managing Split Transactions

Split transactions are indicated with a special icon in the transaction list. When viewing or editing a split transaction:

- The main transaction shows the total amount
- Expanding the transaction reveals the individual splits
- Each split can be edited independently
- The sum of all splits must equal the total transaction amount

## Transaction List and Filtering

### Transaction List View

The main transaction list displays:
- Date
- Payee
- Category
- Description
- Amount
- Account
- Status indicators (cleared, reconciled)

Transactions can be sorted by any column and grouped by various criteria (date, account, category, etc.).

### Search and Filtering

Budget Bolt provides powerful search and filtering capabilities:

- **Text Search**: Find transactions containing specific text in any field
- **Date Filters**: View transactions from specific time periods
- **Amount Filters**: Find transactions within specific value ranges
- **Category Filters**: Show only transactions in selected categories
- **Account Filters**: View transactions from specific accounts
- **Status Filters**: Filter by cleared/uncleared or reconciled/unreconciled status
- **Tag Filters**: Show transactions with specific tags

### Saved Filters

Frequently used search criteria can be saved as filters for quick access:

1. Set up the desired search and filter parameters
2. Click "Save Filter"
3. Name the filter
4. Access saved filters from the filter menu

## Recurring Transactions

Budget Bolt supports recurring transactions for regular income and expenses.

### Setting Up a Recurring Transaction

To create a recurring transaction:

1. Create a new transaction or select an existing one
2. Click "Make Recurring"
3. Set the recurrence pattern:
   - Frequency (daily, weekly, biweekly, monthly, yearly, custom)
   - Start date
   - End date (optional)
   - Specific details based on frequency (e.g., day of month)
4. Choose whether transactions should be created automatically or require approval
5. Save the recurring setup

### Managing Recurring Transactions

Recurring transactions can be managed from the Recurring Transactions section:

- View all recurring transaction schedules
- Edit recurrence patterns
- Skip individual occurrences
- End recurring series
- View upcoming scheduled transactions

## Transaction Status Management

### Cleared vs. Uncleared Transactions

Transactions in Budget Bolt can have two status states:

- **Cleared**: Transactions that have been processed by the financial institution
- **Uncleared**: Pending transactions or those not yet confirmed by the bank

To change a transaction's cleared status:

1. Select the transaction
2. Click the "Cleared" checkbox or use the status dropdown
3. Save the change

### Reconciliation

Reconciliation is the process of matching your recorded transactions with your bank statement:

1. For each transaction on your statement, mark it as "cleared" in Budget Bolt
2. Use the [[account-reconciliation|Account Reconciliation]] feature to complete the process
3. Once reconciled, transactions are locked to prevent accidental changes

## Integration with Other Features

Transaction Management integrates with several other Budget Bolt features:

- **[[account-management|Account Management]]**: Transactions affect account balances
- **[[budget-interface|Budget Interface]]**: Transactions count against category budgets
- **[[rule-based-categorization|Rule-Based Categorization]]**: Rules automatically categorize transactions
- **[[financial-calendar|Financial Calendar]]**: Recurring transactions appear on the calendar
- **[[historical-data|Historical Data and Reporting]]**: Transactions provide data for reports
- **[[account-reconciliation|Account Reconciliation]]**: Transactions are matched with bank statements

## Bulk Operations

Budget Bolt supports several bulk operations for efficient transaction management:

- **Multi-select**: Select multiple transactions by holding Ctrl/Cmd while clicking
- **Bulk Edit**: Change properties for multiple transactions at once
- **Bulk Delete**: Remove multiple transactions simultaneously
- **Bulk Categorize**: Assign the same category to multiple transactions
- **Bulk Clear/Unclear**: Change the cleared status of multiple transactions

## Best Practices

For effective transaction management in Budget Bolt:

1. **Enter transactions promptly** to maintain an accurate financial picture
2. **Use consistent payee names** to improve automatic categorization
3. **Add meaningful descriptions** for better searchability and context
4. **Reconcile regularly** with bank statements to ensure accuracy
5. **Use tags** for additional organization beyond categories
6. **Review recurring transactions periodically** to ensure they remain valid

## Limitations and Planned Enhancements

Current limitations of the Transaction Management system:

- Basic search functionality without advanced operators
- Limited inline editing capabilities
- Basic visualization of transaction history

Planned enhancements:

- Enhanced type-ahead search for categories and payees
- More robust inline editing capabilities
- Better visualization of transaction history
- Advanced search with boolean operators
- Transaction attachments (receipts, invoices)
- Enhanced bulk operations

## Troubleshooting

Common issues with transaction management:

- **Missing transactions**: Check import settings or account synchronization
- **Incorrect categorization**: Review automatic categorization rules
- **Balance discrepancies**: Use reconciliation to identify missing or duplicate transactions
- **Duplicate transactions**: Use the duplicate detection tools during import

---

**Next**: [[rule-based-categorization|Rule-Based Categorization]] | **Previous**: [[budget-interface|Budget and Category Interface]] | [[../project-overview/features-summary|Back to Features Summary]] | [[../README|Back to Main Documentation]]