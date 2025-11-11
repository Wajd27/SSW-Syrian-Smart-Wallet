export interface GuideSection {
  id: string;
  title: string;
  items: GuideItem[];
}

export interface GuideItem {
  id: string;
  title: string;
  content: string;
  steps?: string[];
}

export const guideContent: GuideSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      {
        id: 'account-creation',
        title: 'Creating Your Account',
        content: 'To get started with the Wallet Management app, you need to create an account. Click on the "Register" button and provide your email, password, and full name. Once registered, you can log in and start managing your finances.',
        steps: [
          'Click on "Register" from the login page',
          'Enter your email address',
          'Create a strong password',
          'Enter your full name',
          'Click "Register" to create your account',
          'Log in with your credentials'
        ],
      },
      {
        id: 'first-wallet',
        title: 'Setting Up Your First Wallet',
        content: 'A wallet is where you track your money. You can create multiple wallets for different purposes (e.g., personal, business, savings). Each wallet has its own currency and balance.',
        steps: [
          'Navigate to the "Wallets" page from the sidebar',
          'Click the "Add Wallet" button',
          'Enter a name for your wallet (e.g., "Main Account")',
          'Select the wallet type (Personal, Business, Savings)',
          'Choose the currency (SYP, USD, etc.)',
          'Set the initial balance if you have existing funds',
          'Click "Save" to create your wallet'
        ],
      },
      {
        id: 'navigation',
        title: 'Understanding Navigation',
        content: 'The app has a sidebar (desktop) or mobile menu that provides quick access to all features. The main sections are: Dashboard, Wallets, Transactions, Recurring, Budgets, Savings Goals, Investments, Debts, Family, AI Assistant, Reports, and Settings.',
      },
    ],
  },
  {
    id: 'wallets',
    title: 'Managing Wallets',
    items: [
      {
        id: 'create-wallet',
        title: 'Creating Wallets',
        content: 'You can create multiple wallets to organize your finances. For example, you might have a personal wallet, a business wallet, and a savings wallet. Each wallet operates independently with its own balance and currency.',
      },
      {
        id: 'multiple-currencies',
        title: 'Multiple Currencies',
        content: 'Each wallet can have a different currency. The app supports SYP, USD, and other currencies. When you add transactions, you can specify the currency, and the app will handle conversions using exchange rates.',
      },
      {
        id: 'wallet-types',
        title: 'Wallet Types',
        content: 'Choose the wallet type that best describes its purpose: Personal (for everyday expenses), Business (for business transactions), or Savings (for saving money). This helps organize your finances and generate better reports.',
      },
    ],
  },
  {
    id: 'transactions',
    title: 'Transactions',
    items: [
      {
        id: 'add-transaction',
        title: 'Adding Transactions',
        content: 'Transactions are the core of financial tracking. You can add income (money coming in) or expenses (money going out). Each transaction is linked to a wallet and can be categorized for better organization.',
        steps: [
          'Go to the "Transactions" page',
          'Click "Add Transaction"',
          'Select the wallet',
          'Choose transaction type (Income or Expense)',
          'Enter the amount',
          'Select currency (SYP or USD)',
          'Choose a category',
          'Add a description/notes',
          'Select the date',
          'Optionally attach a receipt',
          'Click "Save"'
        ],
      },
      {
        id: 'categories',
        title: 'Using Categories',
        content: 'Categories help you organize and analyze your spending. Common categories include Food, Transport, Utilities, Entertainment, Healthcare, Education, Shopping, and Other. You can filter transactions by category to see spending patterns.',
      },
      {
        id: 'receipts',
        title: 'Attaching Receipts',
        content: 'You can attach receipts to transactions for record-keeping. Click "Upload Receipt" when adding or editing a transaction, select an image file, and it will be stored securely with the transaction.',
      },
      {
        id: 'exchange-rates',
        title: 'Exchange Rates',
        content: 'When adding transactions in different currencies, the app uses exchange rates to convert amounts. You can set your preferred exchange rate in Settings, and it will be used as the default for new transactions. The dashboard shows the current exchange rate.',
      },
    ],
  },
  {
    id: 'budgets',
    title: 'Budgets',
    items: [
      {
        id: 'setting-budgets',
        title: 'Setting Up Budgets',
        content: 'Budgets help you control spending by setting limits for different categories each month. You can create budgets for categories like Food, Transport, Entertainment, etc. The app tracks your spending against these budgets and alerts you when you approach or exceed them.',
        steps: [
          'Navigate to the "Budgets" page',
          'Click "Add Budget"',
          'Select the wallet',
          'Choose a category (e.g., Food)',
          'Enter the budget amount for the month',
          'Select the month (YYYY-MM format)',
          'Click "Save"'
        ],
      },
      {
        id: 'budget-tracking',
        title: 'Tracking Budget Progress',
        content: 'The app automatically tracks your spending against budgets. Each budget card shows: the budgeted amount, how much you\'ve spent, how much remains, and a progress bar. Green means you\'re under budget, yellow means you\'re close (80-100%), and red means you\'ve exceeded the budget.',
      },
      {
        id: 'budget-alerts',
        title: 'Budget Alerts',
        content: 'You\'ll receive notifications when you reach 50%, 80%, and 100% of your budget. These alerts help you stay on track and avoid overspending. You can view budget status on the dashboard and transactions page.',
      },
      {
        id: 'budget-analysis',
        title: 'Budget Analysis',
        content: 'The budgets page shows how your actual spending compares to your budgeted amounts. You can see which categories you\'re overspending in and adjust your budgets accordingly. Use this information to create more realistic budgets for future months.',
      },
    ],
  },
  {
    id: 'savings-goals',
    title: 'Savings Goals',
    items: [
      {
        id: 'create-goals',
        title: 'Creating Savings Goals',
        content: 'Savings goals help you save for specific purposes (e.g., vacation, car, house). Set a target amount and target date, then track your progress as you add money to the goal.',
        steps: [
          'Go to the "Savings Goals" page',
          'Click "Add Savings Goal"',
          'Select the wallet',
          'Enter a title for your goal',
          'Set the target amount',
          'Set the current amount (if you\'ve already saved)',
          'Choose a target date',
          'Add a description and category',
          'Click "Save"'
        ],
      },
      {
        id: 'track-progress',
        title: 'Tracking Progress',
        content: 'Each savings goal shows a progress bar indicating how close you are to your target. You can manually update the current amount as you save, or link investments to automatically track growth. The app calculates the percentage complete and time remaining.',
      },
      {
        id: 'link-investments',
        title: 'Linking Investments',
        content: 'You can link investments to savings goals. When you create an investment, you can specify which savings goal it contributes to. The investment\'s current value will be included in the goal\'s progress calculation, helping you reach your target faster.',
      },
    ],
  },
  {
    id: 'recurring',
    title: 'Recurring Transactions',
    items: [
      {
        id: 'setup-recurring',
        title: 'Setting Up Recurring Transactions',
        content: 'Recurring transactions are regular income or expenses that happen automatically (e.g., salary, rent, subscriptions). Set them up once, and the app will process them automatically on the scheduled date.',
        steps: [
          'Go to the "Recurring" page',
          'Click "Add Recurring Transaction"',
          'Select the wallet',
          'Choose type (Income or Expense)',
          'Enter amount and currency',
          'Select frequency (Daily, Weekly, Monthly, Yearly)',
          'Set the next occurrence date',
          'Choose a category',
          'Click "Save"'
        ],
      },
      {
        id: 'frequency-options',
        title: 'Frequency Options',
        content: 'You can set recurring transactions to occur Daily, Weekly, Monthly, or Yearly. The app will automatically create the transaction on the scheduled date. You can view upcoming recurring transactions and manually trigger them if needed.',
      },
      {
        id: 'auto-processing',
        title: 'Automatic Processing',
        content: 'The app checks for due recurring transactions every 5 minutes. When a recurring transaction is due, it\'s automatically processed and added to your transactions. You\'ll receive a notification when this happens.',
      },
    ],
  },
  {
    id: 'investments',
    title: 'Investments',
    items: [
      {
        id: 'add-investment',
        title: 'Adding Investments',
        content: 'Track your investments (stocks, bonds, real estate, etc.) to see how they contribute to your net worth and savings goals. Each investment has an initial amount, current value, and can be linked to a savings goal.',
        steps: [
          'Navigate to the "Investments" page',
          'Click "Add Investment"',
          'Enter investment name',
          'Select investment type',
          'Enter initial amount and current value',
          'Choose currency',
          'Set purchase date',
          'Select risk level (Low, Medium, High)',
          'Optionally link to a savings goal',
          'Add notes',
          'Click "Save"'
        ],
      },
      {
        id: 'risk-levels',
        title: 'Understanding Risk Levels',
        content: 'Risk levels help you understand the potential volatility of your investments: Low (stable, lower returns), Medium (moderate risk and returns), High (volatile, higher potential returns). Diversify your portfolio across different risk levels.',
      },
      {
        id: 'track-performance',
        title: 'Tracking Performance',
        content: 'The app calculates your investment returns as a percentage: (Current Value - Initial Amount) / Initial Amount * 100. You can update the current value regularly to track performance. Reports show investment performance over time.',
      },
    ],
  },
  {
    id: 'debts',
    title: 'Debts',
    items: [
      {
        id: 'track-debts',
        title: 'Tracking Debts',
        content: 'Keep track of all your debts (loans, credit cards, etc.) to understand your financial obligations. Each debt has an original amount, current balance, minimum payment, interest rate, and due date.',
        steps: [
          'Go to the "Debts" page',
          'Click "Add Debt"',
          'Enter debt name',
          'Select debt type',
          'Enter original amount and current balance',
          'Set minimum payment',
          'Enter interest rate (if applicable)',
          'Set due date',
          'Enter creditor name',
          'Choose currency',
          'Click "Save"'
        ],
      },
      {
        id: 'payment-schedules',
        title: 'Payment Schedules',
        content: 'The app tracks your debt payments and shows how much you owe. You can see the minimum payment required and the total balance. Update the current balance as you make payments to track your progress.',
      },
      {
        id: 'interest-calculations',
        title: 'Interest Calculations',
        content: 'Enter the interest rate for each debt to understand the total cost. The app shows your current balance, which includes accrued interest. Regularly updating the balance helps you see the true cost of your debts.',
      },
    ],
  },
  {
    id: 'family',
    title: 'Family Management',
    items: [
      {
        id: 'add-family',
        title: 'Adding Family Members',
        content: 'Track expenses for family members to see spending patterns. Add family members and then assign transactions to them to understand who spends what.',
        steps: [
          'Go to the "Family" page',
          'Click "Add Family Member"',
          'Enter name',
          'Select relationship',
          'Enter date of birth (optional)',
          'Click "Save"'
        ],
      },
      {
        id: 'expense-attribution',
        title: 'Attributing Expenses',
        content: 'When adding a transaction, you can assign it to a family member. This helps you track spending by person and generate reports showing expenses per family member.',
      },
    ],
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    items: [
      {
        id: 'ask-questions',
        title: 'Asking Questions',
        content: 'The AI Assistant can answer questions about your finances. Ask things like "How can I save more money?" or "What\'s my spending pattern?" The AI analyzes your data and provides personalized advice.',
      },
      {
        id: 'recommendations',
        title: 'Understanding Recommendations',
        content: 'The AI analyzes your budgets, savings goals, debts, and investments to provide recommendations. Each recommendation shows the impact (High/Medium/Low), effort required, and estimated savings. You can save recommendations and mark them as implemented.',
      },
      {
        id: 'implement-suggestions',
        title: 'Implementing Suggestions',
        content: 'When you receive a recommendation, review it and decide if you want to implement it. You can save the recommendation for later or mark it as implemented once you\'ve taken action. The AI learns from your financial patterns to provide better suggestions.',
      },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    items: [
      {
        id: 'financial-summaries',
        title: 'Financial Summaries',
        content: 'The Reports page provides a comprehensive overview of your finances. See total income, total expenses, net cash flow, and investment performance. Charts visualize your financial data for easy understanding.',
      },
      {
        id: 'spending-analysis',
        title: 'Spending Analysis',
        content: 'Charts show your spending by category, income vs expenses over time, and investment performance. Use these insights to identify spending patterns and make informed financial decisions.',
      },
      {
        id: 'investment-performance',
        title: 'Investment Performance',
        content: 'See how your investments are performing with return percentages and growth charts. Compare different investments to understand which are contributing most to your financial goals.',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    items: [
      {
        id: 'profile',
        title: 'Profile Management',
        content: 'Update your profile information, including your name and email. You can also set your default currency and preferred exchange rate.',
      },
      {
        id: 'notifications',
        title: 'Notification Settings',
        content: 'Configure how and when you receive notifications. Enable or disable notifications for budgets, savings goals, recurring transactions, and more. You can also control haptic feedback and sound effects.',
      },
      {
        id: 'preferences',
        title: 'Preferences',
        content: 'Set your language preference (Arabic/English), default currency, and exchange rate. These settings are used throughout the app to personalize your experience.',
      },
    ],
  },
  {
    id: 'financial-status',
    title: 'Understanding Your Financial Status',
    items: [
      {
        id: 'how-they-work-together',
        title: 'How Everything Works Together',
        content: `Your financial status is calculated by combining all your financial data:

NET WORTH = (Wallet Balances + Investment Values) - Total Debts

The app tracks relationships between entities:
- Transactions affect wallet balances and budgets
- Budgets track spending from transactions
- Savings goals can be funded by transactions and investments
- Investments can be linked to savings goals
- Debts reduce your net worth
- All entities together create your complete financial picture

The dashboard shows your overall financial health score, which considers:
- Net worth (positive is better)
- Savings rate (higher is better)
- Debt-to-income ratio (lower is better)
- Budget adherence (staying within budgets)
- Progress toward savings goals

Use the dashboard to get a quick overview, then dive into specific areas (budgets, goals, investments) to make improvements.`,
      },
      {
        id: 'financial-health',
        title: 'Financial Health Score',
        content: 'Your financial health score (0-100) is calculated based on multiple factors: net worth, savings rate, debt-to-income ratio, budget adherence, and goal progress. Excellent (80+), Good (60-79), Fair (40-59), Poor (<40). Use this score to track your financial improvement over time.',
      },
      {
        id: 'improving-status',
        title: 'Improving Your Financial Status',
        content: 'To improve your financial status: 1) Stay within budgets to control spending, 2) Increase savings rate by reducing expenses or increasing income, 3) Pay down debts to reduce liabilities, 4) Invest wisely to grow assets, 5) Set and achieve savings goals. The AI Assistant can provide personalized recommendations based on your specific situation.',
      },
    ],
  },
];

