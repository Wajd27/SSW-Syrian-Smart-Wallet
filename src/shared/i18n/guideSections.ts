/**
 * User Guide section copy — merged into i18n as userGuide.sections.*
 * Keys mirror guideStructure ids (hyphenated section/item ids).
 */
export type GuideItemLocale = {
  title: string;
  content: string;
  steps?: string[];
};

export type GuideSectionLocale = {
  title: string;
  items: Record<string, GuideItemLocale>;
};

export type GuideSectionsMap = Record<string, GuideSectionLocale>;

export const guideSectionsEn: GuideSectionsMap = {
  'getting-started': {
    title: 'Getting Started',
    items: {
      'account-creation': {
        title: 'Creating Your Account',
        content:
          'To get started with the Wallet Management app, you need to create an account. Click on the "Register" button and provide your email, password, and full name. Once registered, you can log in and start managing your finances.',
        steps: [
          'Click on "Register" from the login page',
          'Enter your email address',
          'Create a strong password',
          'Enter your full name',
          'Click "Register" to create your account',
          'Log in with your credentials',
        ],
      },
      'first-wallet': {
        title: 'Setting Up Your First Wallet',
        content:
          'A wallet is where you track your money. You can create multiple wallets for different purposes (e.g., personal, business, savings). Each wallet has its own currency and balance.',
        steps: [
          'Navigate to the "Wallets" page from the sidebar',
          'Click the "Add Wallet" button',
          'Enter a name for your wallet (e.g., "Main Account")',
          'Select the wallet type (Personal, Business, Savings)',
          'Choose the currency (SYP, USD, etc.)',
          'Set the initial balance if you have existing funds',
          'Click "Save" to create your wallet',
        ],
      },
      navigation: {
        title: 'Understanding Navigation',
        content:
          'The app has a sidebar (desktop) or mobile menu that provides quick access to all features. The main sections are: Dashboard, Wallets, Transactions, Recurring, Budgets, Savings Goals, Investments, Debts, Family, AI Assistant, Reports, and Settings.',
      },
      'install-pwa': {
        title: 'Installing the app (PWA)',
        content:
          'Install Wallet Management on your device for faster access and offline support. On Android or desktop Chrome, you may see an install banner after a few seconds or use the install button in the header when the browser offers it. On iPhone or iPad, add the site to your Home Screen from Safari (other browsers on iOS may not support install).',
        steps: [
          'Chrome / Edge / Android: use the in-app Install button in the header when shown, or accept the install banner',
          'If you dismissed the banner, clear site data or use the browser menu Install app when available',
          'iPhone / iPad: open this site in Safari',
          'Tap the Share button, then Add to Home Screen',
          'Tap Add to confirm',
        ],
      },
    },
  },
  wallets: {
    title: 'Managing Wallets',
    items: {
      'create-wallet': {
        title: 'Creating Wallets',
        content:
          'You can create multiple wallets to organize your finances. For example, you might have a personal wallet, a business wallet, and a savings wallet. Each wallet operates independently with its own balance and currency.',
      },
      'multiple-currencies': {
        title: 'Multiple Currencies',
        content:
          'Each wallet can have a different currency. The app supports SYP, USD, and other currencies. When you add transactions, you can specify the currency, and the app will handle conversions using exchange rates.',
      },
      'wallet-types': {
        title: 'Wallet Types',
        content:
          'Choose the wallet type that best describes its purpose: Personal (for everyday expenses), Business (for business transactions), or Savings (for saving money). This helps organize your finances and generate better reports.',
      },
    },
  },
  transactions: {
    title: 'Transactions',
    items: {
      'add-transaction': {
        title: 'Adding Transactions',
        content:
          'Transactions are the core of financial tracking. You can add income (money coming in) or expenses (money going out). Each transaction is linked to a wallet and can be categorized for better organization.',
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
          'Click "Save"',
        ],
      },
      categories: {
        title: 'Using Categories',
        content:
          'Categories help you organize and analyze your spending. Common categories include Food, Transport, Utilities, Entertainment, Healthcare, Education, Shopping, and Other. You can filter transactions by category to see spending patterns.',
      },
      receipts: {
        title: 'Attaching Receipts',
        content:
          'Receipt attachments are coming soon. When available, you will be able to upload an image when adding or editing a transaction so it is stored with the record.',
      },
      'exchange-rates': {
        title: 'Exchange Rates',
        content:
          'When adding transactions in different currencies, the app uses exchange rates to convert amounts. You can set your preferred exchange rate in Settings, and it will be used as the default for new transactions. The dashboard shows the current exchange rate.',
      },
    },
  },
  budgets: {
    title: 'Budgets',
    items: {
      'setting-budgets': {
        title: 'Setting Up Budgets',
        content:
          'Budgets help you control spending by setting limits for different categories each month. You can create budgets for categories like Food, Transport, Entertainment, etc. The app tracks your spending against these budgets and alerts you when you approach or exceed them.',
        steps: [
          'Navigate to the "Budgets" page',
          'Click "Add Budget"',
          'Select the wallet',
          'Choose a category (e.g., Food)',
          'Enter the budget amount for the month',
          'Select the month (YYYY-MM format)',
          'Click "Save"',
        ],
      },
      'budget-tracking': {
        title: 'Tracking Budget Progress',
        content:
          "The app automatically tracks your spending against budgets. Each budget card shows: the budgeted amount, how much you've spent, how much remains, and a progress bar. Green means you're under budget, yellow means you're close (80-100%), and red means you've exceeded the budget.",
      },
      'budget-alerts': {
        title: 'Budget Alerts',
        content:
          "You'll receive notifications when you reach 50%, 80%, and 100% of your budget. These alerts help you stay on track and avoid overspending. You can view budget status on the dashboard and transactions page.",
      },
      'budget-analysis': {
        title: 'Budget Analysis',
        content:
          "The budgets page shows how your actual spending compares to your budgeted amounts. You can see which categories you're overspending in and adjust your budgets accordingly. Use this information to create more realistic budgets for future months.",
      },
    },
  },
  'savings-goals': {
    title: 'Savings Goals',
    items: {
      'create-goals': {
        title: 'Creating Savings Goals',
        content:
          'Savings goals help you save for specific purposes (e.g., vacation, car, house). Set a target amount and target date, then track your progress as you add money to the goal.',
        steps: [
          'Go to the "Savings Goals" page',
          'Click "Add Savings Goal"',
          'Select the wallet',
          'Enter a title for your goal',
          'Set the target amount',
          "Set the current amount (if you've already saved)",
          'Choose a target date',
          'Add a description and category',
          'Click "Save"',
        ],
      },
      'track-progress': {
        title: 'Tracking Progress',
        content:
          'Each savings goal shows a progress bar indicating how close you are to your target. You can manually update the current amount as you save, or link investments to automatically track growth. The app calculates the percentage complete and time remaining.',
      },
      'link-investments': {
        title: 'Linking Investments',
        content:
          "You can link investments to savings goals. When you create an investment, you can specify which savings goal it contributes to. The investment's current value will be included in the goal's progress calculation, helping you reach your target faster.",
      },
    },
  },
  recurring: {
    title: 'Recurring Transactions',
    items: {
      'setup-recurring': {
        title: 'Setting Up Recurring Transactions',
        content:
          'Recurring transactions are regular income or expenses that happen automatically (e.g., salary, rent, subscriptions). Set them up once, and the app will process them automatically on the scheduled date.',
        steps: [
          'Go to the "Recurring" page',
          'Click "Add Recurring Transaction"',
          'Select the wallet',
          'Choose type (Income or Expense)',
          'Enter amount and currency',
          'Select frequency (Daily, Weekly, Monthly, Yearly)',
          'Set the next occurrence date',
          'Choose a category',
          'Click "Save"',
        ],
      },
      'frequency-options': {
        title: 'Frequency Options',
        content:
          'You can set recurring transactions to occur Daily, Weekly, Monthly, or Yearly. The app will automatically create the transaction on the scheduled date. You can view upcoming recurring transactions and manually trigger them if needed.',
      },
      'auto-processing': {
        title: 'Automatic Processing',
        content:
          "The app checks for due recurring transactions every 5 minutes. When a recurring transaction is due, it's automatically processed and added to your transactions. You'll receive a notification when this happens.",
      },
    },
  },
  investments: {
    title: 'Investments',
    items: {
      'add-investment': {
        title: 'Adding Investments',
        content:
          'Track your investments (stocks, bonds, real estate, etc.) to see how they contribute to your net worth and savings goals. Each investment has an initial amount, current value, and can be linked to a savings goal.',
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
          'Click "Save"',
        ],
      },
      'risk-levels': {
        title: 'Understanding Risk Levels',
        content:
          'Risk levels help you understand the potential volatility of your investments: Low (stable, lower returns), Medium (moderate risk and returns), High (volatile, higher potential returns). Diversify your portfolio across different risk levels.',
      },
      'track-performance': {
        title: 'Tracking Performance',
        content:
          'The app calculates your investment returns as a percentage: (Current Value - Initial Amount) / Initial Amount * 100. You can update the current value regularly to track performance. Reports show investment performance over time.',
      },
    },
  },
  debts: {
    title: 'Debts',
    items: {
      'track-debts': {
        title: 'Tracking Debts',
        content:
          'Keep track of all your debts (loans, credit cards, etc.) to understand your financial obligations. Each debt has an original amount, current balance, minimum payment, interest rate, and due date.',
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
          'Click "Save"',
        ],
      },
      'payment-schedules': {
        title: 'Payment Schedules',
        content:
          'The app tracks your debt payments and shows how much you owe. You can see the minimum payment required and the total balance. Update the current balance as you make payments to track your progress.',
      },
      'interest-calculations': {
        title: 'Interest Calculations',
        content:
          'Enter the interest rate for each debt to understand the total cost. The app shows your current balance, which includes accrued interest. Regularly updating the balance helps you see the true cost of your debts.',
      },
    },
  },
  family: {
    title: 'Family Management',
    items: {
      'add-family': {
        title: 'Adding Family Members',
        content:
          'Track expenses for family members to see spending patterns. Add family members and then assign transactions to them to understand who spends what.',
        steps: [
          'Go to the "Family" page',
          'Click "Add Family Member"',
          'Enter name',
          'Select relationship',
          'Enter date of birth (optional)',
          'Click "Save"',
        ],
      },
      'expense-attribution': {
        title: 'Attributing Expenses',
        content:
          'When adding a transaction, you can assign it to a family member. This helps you track spending by person and generate reports showing expenses per family member.',
      },
    },
  },
  'ai-assistant': {
    title: 'AI Assistant',
    items: {
      'ask-questions': {
        title: 'Asking Questions',
        content:
          'The AI Assistant can answer questions about your finances. Ask things like "How can I save more money?" or "What\'s my spending pattern?" The AI analyzes your data and provides personalized advice.',
      },
      recommendations: {
        title: 'Understanding Recommendations',
        content:
          'The AI analyzes your budgets, savings goals, debts, and investments to provide recommendations. Each recommendation shows the impact (High/Medium/Low), effort required, and estimated savings. You can save recommendations and mark them as implemented.',
      },
      'implement-suggestions': {
        title: 'Implementing Suggestions',
        content:
          'When you receive a recommendation, review it and decide if you want to implement it. You can save the recommendation for later or mark it as implemented once you\'ve taken action. The AI learns from your financial patterns to provide better suggestions.',
      },
    },
  },
  reports: {
    title: 'Reports',
    items: {
      'financial-summaries': {
        title: 'Financial Summaries',
        content:
          'The Reports page provides a comprehensive overview of your finances. See total income, total expenses, net cash flow, and investment performance. Charts visualize your financial data for easy understanding.',
      },
      'spending-analysis': {
        title: 'Spending Analysis',
        content:
          'Charts show your spending by category, income vs expenses over time, and investment performance. Use these insights to identify spending patterns and make informed financial decisions.',
      },
      'investment-performance': {
        title: 'Investment Performance',
        content:
          'See how your investments are performing with return percentages and growth charts. Compare different investments to understand which are contributing most to your financial goals.',
      },
    },
  },
  settings: {
    title: 'Settings',
    items: {
      profile: {
        title: 'Profile Management',
        content:
          'Update your profile information, including your name and email. You can also set your default currency and preferred exchange rate.',
      },
      notifications: {
        title: 'Notification Settings',
        content:
          'Configure how and when you receive notifications. Enable or disable notifications for budgets, savings goals, recurring transactions, and more. You can also control haptic feedback and sound effects.',
      },
      preferences: {
        title: 'Preferences',
        content:
          'Set your language preference (Arabic/English), default currency, and exchange rate. These settings are used throughout the app to personalize your experience.',
      },
    },
  },
  'financial-status': {
    title: 'Understanding Your Financial Status',
    items: {
      'how-they-work-together': {
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
      'financial-health': {
        title: 'Financial Health Score',
        content:
          'Your financial health score (0-100) is calculated based on multiple factors: net worth, savings rate, debt-to-income ratio, budget adherence, and goal progress. Excellent (80+), Good (60-79), Fair (40-59), Poor (<40). Use this score to track your financial improvement over time.',
      },
      'improving-status': {
        title: 'Improving Your Financial Status',
        content:
          'To improve your financial status: 1) Stay within budgets to control spending, 2) Increase savings rate by reducing expenses or increasing income, 3) Pay down debts to reduce liabilities, 4) Invest wisely to grow assets, 5) Set and achieve savings goals. The AI Assistant can provide personalized recommendations based on your specific situation.',
      },
    },
  },
};

export const guideSectionsAr: GuideSectionsMap = {
  'getting-started': {
    title: 'البدء',
    items: {
      'account-creation': {
        title: 'إنشاء حسابك',
        content:
          'للبدء مع تطبيق إدارة المحافظ، أنشئ حساباً. اضغط «تسجيل» وأدخل البريد وكلمة المرور والاسم الكامل. بعد التسجيل يمكنك تسجيل الدخول وإدارة أموالك.',
        steps: [
          'اضغط «تسجيل» من صفحة الدخول',
          'أدخل بريدك الإلكتروني',
          'اختر كلمة مرور قوية',
          'أدخل اسمك الكامل',
          'اضغط «تسجيل» لإنشاء الحساب',
          'سجّل الدخول ببياناتك',
        ],
      },
      'first-wallet': {
        title: 'إعداد أول محفظة',
        content:
          'المحفظة هي المكان الذي تتبع فيه أموالك. يمكنك إنشاء عدة محافظ لأغراض مختلفة (شخصية، عمل، ادخار). لكل محفظة عملة ورصيد خاصان.',
        steps: [
          'انتقل إلى صفحة «المحافظ» من الشريط الجانبي',
          'اضغط «إضافة محفظة»',
          'أدخل اسماً للمحفظة (مثل «الحساب الرئيسي»)',
          'اختر نوع المحفظة (شخصية، عمل، ادخار)',
          'اختر العملة (ل.س، دولار، إلخ)',
          'حدد الرصيد الابتدائي إن وُجد',
          'اضغط «حفظ» لإنشاء المحفظة',
        ],
      },
      navigation: {
        title: 'فهم التنقل',
        content:
          'يوجد شريط جانبي (على سطح المكتب) أو قائمة للهاتف للوصول السريع. الأقسام الرئيسية: لوحة التحكم، المحافظ، المعاملات، المتكررة، الميزانيات، أهداف الادخار، الاستثمارات، الديون، العائلة، المساعد الذكي، التقارير، والإعدادات.',
      },
      'install-pwa': {
        title: 'تثبيت التطبيق (PWA)',
        content:
          'ثبّت التطبيق على جهازك للوصول السريع والعمل دون اتصال عندما يدعم المتصفح ذلك. على أندرويد أو كروم لسطح المكتب قد يظهر شريط تثبيت بعد ثوانٍ أو زر تثبيت في الشريط العلوي. على آيفون/آيباد أضف الموقع إلى الشاشة الرئيسية من سفاري.',
        steps: [
          'كروم / إيدج / أندرويد: استخدم زر التثبيت في الشريط العلوي عند ظهوره أو شريط التثبيت',
          'إذا أغلقت الشريط، جرّب قائمة المتصفح «تثبيت التطبيق» أو امسح بيانات الموقع لإعادة العرض',
          'آيفون / آيباد: افتح الموقع في سفاري',
          'اضغط مشاركة ثم «إضافة إلى الشاشة الرئيسية»',
          'اضغط إضافة للتأكيد',
        ],
      },
    },
  },
  wallets: {
    title: 'إدارة المحافظ',
    items: {
      'create-wallet': {
        title: 'إنشاء محافظ',
        content:
          'يمكنك إنشاء عدة محافظ لتنظيم أموالك (مثلاً شخصية، عمل، ادخار). كل محفظة مستقلة برصيدها وعملتها.',
      },
      'multiple-currencies': {
        title: 'عملات متعددة',
        content:
          'لكل محفظة عملة مختلفة. يدعم التطبيق الليرة السورية والدولار وغيرها. عند إضافة معاملات يمكن تحديد العملة والتحويل بأسعار الصرف.',
      },
      'wallet-types': {
        title: 'أنواع المحافظ',
        content:
          'اختر النوع المناسب: شخصية (مصروفات يومية)، عمل (معاملات العمل)، أو ادخار (توفير). يساعد ذلك على التنظيم والتقارير.',
      },
    },
  },
  transactions: {
    title: 'المعاملات',
    items: {
      'add-transaction': {
        title: 'إضافة معاملات',
        content:
          'المعاملات أساس التتبع المالي. يمكنك تسجيل دخل أو مصروف، وربط كل معاملة بمحفظة وتصنيف.',
        steps: [
          'انتقل إلى صفحة «المعاملات»',
          'اضغط «إضافة معاملة»',
          'اختر المحفظة',
          'اختر النوع (دخل أو مصروف)',
          'أدخل المبلغ',
          'اختر العملة (ل.س أو دولار)',
          'اختر التصنيف',
          'أضف وصفاً أو ملاحظات',
          'حدد التاريخ',
          'يمكنك لاحقاً إرفاق إيصال عند توفر الميزة',
          'اضغط «حفظ»',
        ],
      },
      categories: {
        title: 'استخدام التصنيفات',
        content:
          'التصنيفات تنظم الإنفاق والتحليل. أمثلة: طعام، مواصلات، خدمات، ترفيه، صحة، تعليم، تسوق، وأخرى. يمكن تصفية المعاملات حسب التصنيف.',
      },
      receipts: {
        title: 'إرفاق الإيصالات',
        content:
          'ميزة رفع الإيصالات قيد التطوير. عند التفعيل يمكنك رفع صورة عند إضافة أو تعديل معاملة.',
      },
      'exchange-rates': {
        title: 'أسعار الصرف',
        content:
          'عند المعاملات بعملات مختلفة يستخدم التطبيق أسعار الصرف للتحويل. يمكنك ضبط السعر المفضل في الإعدادات، ويظهر في لوحة التحكم.',
      },
    },
  },
  budgets: {
    title: 'الميزانيات',
    items: {
      'setting-budgets': {
        title: 'إعداد الميزانيات',
        content:
          'الميزانيات تساعدك على ضبط الإنفاق بحدود شهرية لكل تصنيف. يتتبع التطبيق الإنفاق ويُنبّهك عند الاقتراب من الحد أو تجاوزه.',
        steps: [
          'انتقل إلى صفحة «الميزانيات»',
          'اضغط «إضافة ميزانية»',
          'اختر المحفظة',
          'اختر التصنيف (مثل طعام)',
          'أدخل مبلغ الميزانية للشهر',
          'حدد الشهر (سنة-شهر)',
          'اضغط «حفظ»',
        ],
      },
      'budget-tracking': {
        title: 'متابعة تقدم الميزانية',
        content:
          'يتتبع التطبيق الإنفاق تلقائياً. كل بطاقة تعرض الميزانية والمصروف والمتبقي وشريط تقدم. الأخضر تحت الحد، الأصفر قريب (٨٠–١٠٠٪)، الأحمر تجاوز.',
      },
      'budget-alerts': {
        title: 'تنبيهات الميزانية',
        content:
          'ستصلك إشعارات عند ٥٠٪ و٨٠٪ و١٠٠٪ من الميزانية. يمكنك رؤية الحالة في لوحة التحكم وصفحة المعاملات.',
      },
      'budget-analysis': {
        title: 'تحليل الميزانية',
        content:
          'تعرض الصفحة مقارنة الإنفاق الفعلي بالميزانية وتساعدك على تعديل التصنيفات والأشهر القادمة.',
      },
    },
  },
  'savings-goals': {
    title: 'أهداف الادخار',
    items: {
      'create-goals': {
        title: 'إنشاء أهداف ادخار',
        content:
          'حدد هدفاً ومبلغاً مستهدفاً وتاريخاً، ثم تابع التقدم عند إضافة مبالغ للهدف.',
        steps: [
          'انتقل إلى «أهداف الادخار»',
          'اضغط «إضافة هدف ادخار»',
          'اختر المحفظة',
          'أدخل عنوان الهدف',
          'حدد المبلغ المستهدف',
          'حدد المبلغ الحالي إن وُجد',
          'اختر تاريخ الهدف',
          'أضف وصفاً وتصنيفاً',
          'اضغط «حفظ»',
        ],
      },
      'track-progress': {
        title: 'متابعة التقدم',
        content:
          'كل هدف يعرض شريط تقدم. يمكنك تحديث المبلغ يدوياً أو ربط استثمارات للنمو التلقائي.',
      },
      'link-investments': {
        title: 'ربط الاستثمارات',
        content:
          'يمكن ربط الاستثمارات بأهداف الادخار؛ تُحسب القيمة الحالية ضمن تقدم الهدف.',
      },
    },
  },
  recurring: {
    title: 'المعاملات المتكررة',
    items: {
      'setup-recurring': {
        title: 'إعداد معاملات متكررة',
        content:
          'المعاملات المتكررة (راتب، إيجار، اشتراكات) تُنفَّذ تلقائياً في الموعد المحدد بعد الإعداد مرة واحدة.',
        steps: [
          'انتقل إلى «المتكررة»',
          'اضغط «إضافة معاملة متكررة»',
          'اختر المحفظة',
          'اختر النوع (دخل أو مصروف)',
          'أدخل المبلغ والعملة',
          'اختر التكرار (يومي، أسبوعي، شهري، سنوي)',
          'حدد تاريخ التكرار التالي',
          'اختر التصنيف',
          'اضغط «حفظ»',
        ],
      },
      'frequency-options': {
        title: 'خيارات التكرار',
        content:
          'يمكن ضبط التكرار يومياً أو أسبوعياً أو شهرياً أو سنوياً. يُنشئ التطبيق المعاملة في الموعد ويمكنك عرض القادمة وتشغيلها يدوياً إن لزم.',
      },
      'auto-processing': {
        title: 'المعالجة التلقائية',
        content:
          'يفحص التطبيق المعاملات المستحقة كل بضع دقائق ويُضيفها تلقائياً مع إشعار.',
      },
    },
  },
  investments: {
    title: 'الاستثمارات',
    items: {
      'add-investment': {
        title: 'إضافة استثمارات',
        content:
          'تتبع استثماراتك (أسهم، سندات، عقار، إلخ) ومساهمتها في صافي القيمة وأهداف الادخار. لكل استثمار مبلغ ابتدائي وقيمة حالية.',
        steps: [
          'انتقل إلى «الاستثمارات»',
          'اضغط «إضافة استثمار»',
          'أدخل الاسم والنوع',
          'أدخل المبلغ الابتدائي والقيمة الحالية',
          'اختر العملة',
          'حدد تاريخ الشراء',
          'اختر مستوى المخاطرة (منخفض، متوسط، مرتفع)',
          'يمكن ربط هدف ادخار',
          'أضف ملاحظات',
          'اضغط «حفظ»',
        ],
      },
      'risk-levels': {
        title: 'فهم مستويات المخاطرة',
        content:
          'منخفض (أكثر استقراراً)، متوسط، مرتفع (تقلب أعلى). نوّع محفظتك بين المستويات.',
      },
      'track-performance': {
        title: 'متابعة الأداء',
        content:
          'يحسب التطبيق العائد كنسبة مئوية. حدّث القيمة الحالية بانتظام؛ التقارير تعرض الأداء بمرور الوقت.',
      },
    },
  },
  debts: {
    title: 'الديون',
    items: {
      'track-debts': {
        title: 'تتبع الديون',
        content:
          'سجّل قروضك وبطاقاتك لفهم الالتزامات. لكل دين مبلغ أصلي ورصيد حالي وأدنى دفعة ونسبة فائدة وتاريخ استحقاق.',
        steps: [
          'انتقل إلى «الديون»',
          'اضغط «إضافة دين»',
          'أدخل الاسم والنوع',
          'أدخل المبلغ الأصلي والرصيد الحالي',
          'حدد أدنى دفعة',
          'أدخل نسبة الفائدة إن وُجدت',
          'حدد تاريخ الاستحقاق',
          'أدخل اسم الدائن',
          'اختر العملة',
          'اضغط «حفظ»',
        ],
      },
      'payment-schedules': {
        title: 'جداول السداد',
        content:
          'يعرض التطبيق المدفوعات والرصيد. حدّث الرصيد عند السداد لمتابعة التقدم.',
      },
      'interest-calculations': {
        title: 'حساب الفائدة',
        content:
          'أدخل نسبة الفائدة لفهم التكلفة. الرصيد الحالي يشمل الفائدة المتراكمة.',
      },
    },
  },
  family: {
    title: 'إدارة العائلة',
    items: {
      'add-family': {
        title: 'إضافة أفراد العائلة',
        content:
          'أضف أفراداً ثم اربط المعاملات بهم لمعرفة أنماط الإنفاق لكل شخص.',
        steps: [
          'انتقل إلى «العائلة»',
          'اضغط «إضافة فرد»',
          'أدخل الاسم',
          'اختر صلة القرابة',
          'أدخل تاريخ الميلاد (اختياري)',
          'اضغط «حفظ»',
        ],
      },
      'expense-attribution': {
        title: 'إسناد المصروفات',
        content:
          'عند إضافة معاملة يمكن إسنادها لفرد؛ التقارير تعرض الإنفاق لكل فرد.',
      },
    },
  },
  'ai-assistant': {
    title: 'المساعد الذكي',
    items: {
      'ask-questions': {
        title: 'طرح الأسئلة',
        content:
          'يمكن للمساعد الإجابة عن أسئلة مالية. اسأل مثلاً: «كيف أوفر أكثر؟» أو «ما نمط إنفاقي؟» يحلل بياناتك ويعطي نصائحاً مخصصة.',
      },
      recommendations: {
        title: 'فهم التوصيات',
        content:
          'يحلل الميزانيات والأهداف والديون والاستثمارات ويعرض التأثير (عالٍ/متوسط/منخفض) والجهد والتوفير المتوقع. يمكن حفظ التوصيات وتمييز المنفَّذ.',
      },
      'implement-suggestions': {
        title: 'تنفيذ الاقتراحات',
        content:
          'راجع التوصية وقرر التنفيذ. احفظها لاحقاً أو علّمها منفذة. يتعلم النظام من أنماطك لتحسين الاقتراحات.',
      },
    },
  },
  reports: {
    title: 'التقارير',
    items: {
      'financial-summaries': {
        title: 'ملخصات مالية',
        content:
          'صفحة التقارير تعرض الدخل والمصروف وصافي التدفق وأداء الاستثمار مع رسوم بيانية.',
      },
      'spending-analysis': {
        title: 'تحليل الإنفاق',
        content:
          'رسوم بالتصنيف ومقارنة الدخل والمصروف عبر الزمن وأداء الاستثمار لاتخاذ قرارات أفضل.',
      },
      'investment-performance': {
        title: 'أداء الاستثمار',
        content:
          'تابع العائد والنمو ومقارنة الاستثمارات لمعرفة الأكثر مساهمة في أهدافك.',
      },
    },
  },
  settings: {
    title: 'الإعدادات',
    items: {
      profile: {
        title: 'إدارة الملف الشخصي',
        content:
          'حدّث الاسم والبريد والعملة الافتراضية وسعر الصرف المفضل.',
      },
      notifications: {
        title: 'إعدادات الإشعارات',
        content:
          'فعّل أو عطّل إشعارات الميزانيات والأهداف والمتكررة وغيرها، والاهتزاز والصوت.',
      },
      preferences: {
        title: 'التفضيلات',
        content:
          'اختر اللغة (عربي/إنجليزي) والعملة الافتراضية وسعر الصرف؛ تُستخدم في التطبيق بالكامل.',
      },
    },
  },
  'financial-status': {
    title: 'فهم وضعك المالي',
    items: {
      'how-they-work-together': {
        title: 'كيف يعمل كل شيء معاً',
        content: `يُحسب وضعك المالي من دمج بياناتك:

صافي القيمة = (أرصدة المحافظ + قيم الاستثمارات) − إجمالي الديون

علاقات بين الكيانات:
- المعاملات تؤثر على أرصدة المحافظ والميزانيات
- الميزانيات تتتبع الإنفاق من المعاملات
- أهداف الادخار تُمول من معاملات واستثمارات
- يمكن ربط الاستثمارات بأهداف الادخار
- الديون تقلل صافي القيمة
- كل ذلك يشكل صورتك المالية

تعرض لوحة التحكم درجة الصحة المالية مع الأخذ بعين الاعتبار:
- صافي القيمة (الموجب أفضل)
- معدل الادخار (الأعلى أفضل)
- نسبة الدين إلى الدخل (الأقل أفضل)
- الالتزام بالميزانية
- التقدم نحو أهداف الادخار

استخدم لوحة التحكم للنظرة السريعة، ثم انتقل للميزانيات والأهداف والاستثمارات للتحسين.`,
      },
      'financial-health': {
        title: 'درجة الصحة المالية',
        content:
          'الدرجة (٠–١٠٠) تُحسب من صافي القيمة ومعدل الادخار ونسبة الدين إلى الدخل والالتزام بالميزانية وتقدم الأهداف. ممتاز (٨٠+)، جيد (٦٠–٧٩)، متوسط (٤٠–٥٩)، ضعيف (أقل من ٤٠).',
      },
      'improving-status': {
        title: 'تحسين وضعك المالي',
        content:
          'للتحسين: ١) الالتزام بالميزانيات ٢) رفع معدل الادخار بتقليل المصروف أو زيادة الدخل ٣) سداد الديون ٤) استثمار مدروس ٥) تحديد وتحقيق أهداف الادخار. يمكن للمساعد الذكي تقديم توصيات مخصصة.',
      },
    },
  },
};
