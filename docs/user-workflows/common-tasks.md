# Common Tasks in Budget Bolt

This guide walks you through the most common tasks you'll perform in Budget Bolt, providing step-by-step instructions for each workflow.

## Daily Financial Management

### Recording a New Transaction

1. **From the Dashboard or Accounts Screen**:
   - Click the "+" button in the bottom right corner
   - Select "Add Transaction"

2. **Fill in the Transaction Details**:
   - Select the account from the dropdown
   - Enter the date (defaults to today)
   - Enter or select the payee
   - Enter the amount (use negative numbers for expenses)
   - Select the appropriate category
   - Add a description (optional)
   - Add tags if desired (optional)

3. **Save the Transaction**:
   - Click "Save" to record the transaction
   - The account balance will update automatically
   - The budget category will reflect the new transaction

**Quick Tip**: Use the "Quick Add" option from the dashboard for faster entry of simple transactions.

### Checking Account Balances

1. **View All Accounts**:
   - Navigate to the "Accounts" tab
   - See a summary of all accounts with current balances
   - Accounts are grouped by type (checking, savings, credit, etc.)

2. **View Individual Account Details**:
   - Click on any account from the Accounts list
   - See the account balance, recent transactions, and spending trends
   - Use the "View All Transactions" button to see the complete transaction history

**Quick Tip**: Add your most important accounts to the dashboard for at-a-glance balance checking.

### Categorizing Transactions

1. **During Transaction Entry**:
   - Select the appropriate category from the dropdown when adding a transaction
   - For split transactions, click "Split" and assign amounts to multiple categories

2. **Recategorizing Existing Transactions**:
   - Find the transaction in the transaction list
   - Click on the transaction to edit
   - Change the category using the dropdown
   - Save the changes

3. **Bulk Categorization**:
   - In the Transactions view, select multiple transactions (hold Ctrl/Cmd while clicking)
   - Click "Bulk Edit" and select "Change Category"
   - Choose the new category and apply

**Quick Tip**: Set up [[../features/rule-based-categorization|rules for automatic categorization]] to save time with recurring transactions.

## Weekly Financial Management

### Reconciling Accounts

1. **Start Reconciliation**:
   - Navigate to the account you want to reconcile
   - Click the "Reconcile" button
   - Enter the statement ending balance and date

2. **Match Transactions**:
   - Review each transaction on your statement
   - Check off matching transactions in Budget Bolt
   - The difference between your statement and Budget Bolt will update automatically

3. **Complete Reconciliation**:
   - When the difference reaches zero, click "Finish Reconciliation"
   - If there's a small discrepancy, you can create an adjustment transaction
   - Reconciled transactions will be marked and protected from accidental changes

**Quick Tip**: Reconcile your accounts weekly to catch any discrepancies early.

### Reviewing Budget Progress

1. **Check Budget Status**:
   - Navigate to the "Budget" tab
   - Review category progress bars to see spending vs. budget
   - Green bars indicate you're within budget
   - Yellow bars indicate you're approaching your budget limit
   - Red bars indicate you've exceeded your budget

2. **Adjust Budget Allocations**:
   - Click on any category to adjust the budgeted amount
   - Enter the new amount and save
   - The available funds will update automatically

3. **Review Spending Trends**:
   - Scroll down to see spending trends by category
   - Compare current month to previous months
   - Identify categories where spending is increasing or decreasing

**Quick Tip**: Use the "Move Money" feature to reallocate funds from underspent categories to overspent ones.

## Monthly Financial Management

### Creating a New Month's Budget

1. **Navigate to the New Month**:
   - In the Budget view, use the month selector to move to the next month
   - Budget Bolt will prompt you to create a new budget

2. **Choose a Budget Template**:
   - Use last month's budget
   - Start from scratch
   - Use a saved template

3. **Allocate Income**:
   - Enter your expected income for the month
   - Allocate funds to each category
   - Continue until your "To Be Budgeted" amount reaches zero

4. **Review and Adjust**:
   - Check that all essential categories are funded
   - Adjust allocations as needed
   - Save your budget

**Quick Tip**: Budget for irregular expenses (like quarterly insurance) by setting aside a portion each month.

### Generating Monthly Reports

1. **Access Reports**:
   - Navigate to the "Reports" tab
   - Select "Monthly Summary" from the report templates

2. **Configure Report Parameters**:
   - Select the month
   - Choose which accounts to include
   - Select categories of interest

3. **Generate and Review**:
   - Click "Generate Report"
   - Review the visualizations and data tables
   - Use the insights to inform next month's budget

4. **Save or Export**:
   - Save the report for future reference
   - Export to PDF or CSV if needed

**Quick Tip**: Compare reports from consecutive months to track your financial progress over time.

### Reviewing Financial Goals

1. **Access Goals**:
   - Navigate to the "Goals" tab
   - View all active financial goals

2. **Check Progress**:
   - Review the progress bar for each goal
   - See projected completion dates
   - Check if you're on track or falling behind

3. **Adjust Goals if Needed**:
   - Click on a goal to edit
   - Adjust target amounts or dates
   - Modify monthly contribution amounts

**Quick Tip**: Link goals to specific budget categories to automatically track progress as you spend or save.

## Occasional Tasks

### Importing Transactions

1. **Prepare Your File**:
   - Download transactions from your bank in CSV, OFX, or QFX format
   - Save the file to an accessible location

2. **Start Import Process**:
   - Navigate to the account where you want to import transactions
   - Click "Import Transactions"
   - Select the file format and locate your file

3. **Map Fields**:
   - Match columns in your file to Budget Bolt fields
   - Preview the data to ensure correct mapping
   - Set rules for handling duplicates

4. **Complete Import**:
   - Review the transactions to be imported
   - Click "Import" to add the transactions to your account
   - Review and categorize any uncategorized transactions

**Quick Tip**: Save your field mapping for future imports from the same source.

### Setting Up a New Account

1. **Add the Account**:
   - Navigate to the "Accounts" tab
   - Click "Add Account"
   - Select the account type

2. **Enter Account Details**:
   - Name the account
   - Enter the current balance
   - Select a color and icon (optional)
   - Choose whether to include in net worth calculations

3. **Connect to Bank (Optional)**:
   - Click "Connect to Bank"
   - Search for your financial institution
   - Enter your credentials securely
   - Select the accounts to connect

4. **Finalize Setup**:
   - Review the account details
   - Click "Save" to create the account
   - The account will now appear in your accounts list

**Quick Tip**: Use meaningful names for your accounts that indicate their purpose, not just the bank name.

### Creating and Managing Rules

1. **Create a New Rule**:
   - Navigate to "Settings" > "Rules"
   - Click "Add Rule"

2. **Set Rule Conditions**:
   - Choose the field to match (payee, description, amount, etc.)
   - Select the condition type (contains, equals, greater than, etc.)
   - Enter the value to match

3. **Set Rule Actions**:
   - Choose the category to assign
   - Set additional fields (tags, memo, etc.) if desired

4. **Test and Save**:
   - Click "Test Rule" to see which transactions would match
   - Adjust if needed
   - Save the rule

**Quick Tip**: Order your rules from most specific to most general for best results.

### Exporting Data for Tax Purposes

1. **Configure Export**:
   - Navigate to "Reports" > "Tax Report"
   - Select the tax year
   - Choose relevant categories (income, deductions, etc.)

2. **Generate Report**:
   - Click "Generate Tax Report"
   - Review the summary and detailed transactions

3. **Export Data**:
   - Click "Export"
   - Choose format (CSV, PDF, etc.)
   - Save the file to your computer

**Quick Tip**: Tag tax-related transactions throughout the year to make tax time easier.

## Troubleshooting Common Issues

### Fixing Categorization Mistakes

1. **Find the Transaction**:
   - Use search or filters to locate the transaction
   - Click on the transaction to edit

2. **Correct the Category**:
   - Select the correct category
   - Save the changes

3. **Prevent Future Mistakes**:
   - Consider creating a rule for similar transactions
   - Review automatic categorization rules if they're causing errors

### Resolving Budget Discrepancies

1. **Identify the Issue**:
   - Check if all transactions are properly categorized
   - Verify that the budget amounts are correct
   - Look for uncategorized or miscategorized transactions

2. **Fix Transaction Issues**:
   - Recategorize transactions as needed
   - Check for split transactions that may be incorrectly allocated

3. **Adjust Budget if Needed**:
   - Update budget allocations to reflect actual needs
   - Consider moving money between categories

### Handling Duplicate Transactions

1. **Identify Duplicates**:
   - Look for transactions with the same date, payee, and amount
   - Budget Bolt may flag potential duplicates during import

2. **Remove Duplicates**:
   - Select the duplicate transaction
   - Click "Delete" to remove it
   - Alternatively, use the "Mark as Duplicate" option during import

3. **Prevent Future Duplicates**:
   - Be careful when importing from multiple sources
   - Use the duplicate detection settings during import

---

**Next**: [[best-practices|Best Practices]] | [[../README|Back to Main Documentation]]