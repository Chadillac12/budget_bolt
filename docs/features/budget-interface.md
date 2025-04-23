# Budget and Category Interface

The Budget and Category Interface is a core component of Budget Bolt, providing users with tools to plan, allocate, and track their spending across different categories.

## Overview

Budget Bolt implements a zero-based budgeting approach, where users allocate every dollar of income to specific categories until the balance reaches zero. This interface allows users to:

- Create and manage budget categories
- Allocate funds to categories
- Track spending against budgeted amounts
- Visualize budget progress
- Navigate between different budget periods

## Budget Philosophy

Budget Bolt follows these key budgeting principles:

1. **Give Every Dollar a Job**: Allocate all available money to specific categories
2. **Embrace Your True Expenses**: Plan for both regular and irregular expenses
3. **Roll With the Punches**: Adjust your budget as needed when circumstances change
4. **Track Your Progress**: Monitor spending to stay on track with your financial goals

## Budget Categories

### Category Structure

Budget Bolt uses a hierarchical category system:

- **Category Groups**: Top-level organizational units (e.g., "Housing", "Food", "Transportation")
- **Categories**: Specific budget allocations within groups (e.g., "Rent", "Groceries", "Gas")

### Default Categories

Budget Bolt comes with a set of default categories organized into groups:

| Category Group | Example Categories |
|----------------|-------------------|
| Housing | Rent/Mortgage, Utilities, Maintenance |
| Food | Groceries, Dining Out, Coffee Shops |
| Transportation | Car Payment, Gas, Public Transit |
| Personal | Clothing, Gym, Subscriptions |
| Health | Insurance, Doctor, Pharmacy |
| Debt | Credit Card Payments, Student Loans |
| Savings | Emergency Fund, Vacation, Retirement |
| Income | Salary, Freelance, Interest |

### Custom Categories

Users can create custom categories and groups to match their specific budgeting needs:

1. Navigate to the Budget section
2. Click "Manage Categories"
3. Select "Add Category" or "Add Group"
4. Enter a name, select a color, and choose an icon
5. For categories, select a parent group
6. Save the new category or group

### Category Properties

Each category has the following properties:

- **Name**: Descriptive label for the category
- **Group**: Parent category group
- **Color**: Visual identifier
- **Icon**: Visual representation
- **Type**: Income or expense
- **Protected**: Option to prevent accidental deletion

## Budget Creation and Management

### Creating a Budget

To create a new budget:

1. Navigate to the Budget section
2. Select the month for the new budget
3. Enter income amounts
4. Allocate funds to categories
5. Continue until all funds are allocated (zero-based approach)

### Budget Allocation

The budget interface provides several ways to allocate funds:

- **Manual Entry**: Directly enter amounts for each category
- **Quick Budget Options**:
  - Last month's budget
  - Average spent
  - Spent last month
  - Underfunded categories

### Budget Visualization

Budget progress is visualized through:

- **Progress Bars**: Show percentage of budget used
- **Color Coding**:
  - Green: Within budget
  - Yellow: Approaching budget limit (80%+)
  - Red: Over budget
- **Summary Cards**: Display total budgeted, spent, and remaining amounts

## Month-to-Month Budgeting

### Budget Navigation

Users can navigate between different budget periods:

- Use the month selector to switch between months
- View historical budget data
- Plan future budgets

### Budget Rollover

Budget Bolt supports different rollover options:

- **Full Rollover**: Unspent funds from the previous month are added to the current month's category budget
- **Partial Rollover**: Rollover up to a specified maximum amount
- **No Rollover**: Start fresh each month with no carryover

To configure rollover settings:

1. Navigate to Budget Settings
2. Select "Rollover Settings"
3. Choose the desired rollover type
4. If using partial rollover, specify maximum amounts
5. Save settings

## Budget vs. Actual Tracking

The budget interface automatically tracks actual spending against budgeted amounts:

- **Budgeted**: The amount allocated to each category
- **Spent**: The sum of transactions in each category
- **Remaining**: The difference between budgeted and spent amounts

This tracking updates in real-time as transactions are added or modified.

## Integration with Other Features

The Budget Interface integrates with several other Budget Bolt features:

- **[[transaction-management|Transaction Management]]**: Transactions are categorized according to the budget structure
- **[[rule-based-categorization|Rule-Based Categorization]]**: Automatically assigns transactions to budget categories
- **[[historical-data|Historical Data and Reporting]]**: Provides data for budget performance reports
- **[[dashboard|Customizable Dashboard]]**: Budget summary cards can be added to the dashboard
- **[[trend-analysis|Trend Analysis]]**: Budget vs. actual comparisons over time

## Budget Reports

Budget Bolt provides several reports to analyze budget performance:

- **Monthly Summary**: Overview of all categories for a specific month
- **Category Trends**: Spending in a category over time
- **Budget vs. Actual**: Comparison of planned and actual spending
- **Income vs. Expenses**: Overall financial flow

For more details, see the [[historical-data|Historical Data and Reporting]] section.

## Best Practices

For effective budgeting in Budget Bolt:

1. **Start with your income**: Budget only money you actually have
2. **Prioritize essentials**: Allocate to needs before wants
3. **Be realistic**: Set achievable budget targets based on your actual spending patterns
4. **Review regularly**: Adjust your budget as circumstances change
5. **Use specific categories**: More detailed categories provide better insights
6. **Plan for irregular expenses**: Budget monthly for expenses that occur less frequently

## Limitations and Planned Enhancements

Current limitations of the Budget Interface:

- Limited support for multi-month planning
- Basic mathematical operations in budget fields
- Limited drag-and-drop functionality for reorganizing categories

Planned enhancements:

- Enhanced support for math operations in assigned amounts
- More robust drag-and-drop functionality for reorganizing categories
- Budget templates for quick setup
- Goal integration with budget categories
- Enhanced visualization options

## Troubleshooting

Common issues with the Budget Interface:

- **Unallocated funds**: Ensure all available funds are assigned to categories
- **Missing transactions**: Check for uncategorized transactions
- **Budget reset issues**: Verify rollover settings are configured correctly

---

**Next**: [[transaction-management|Transaction Management]] | **Previous**: [[account-management|Account Management]] | [[../project-overview/features-summary|Back to Features Summary]] | [[../README|Back to Main Documentation]]