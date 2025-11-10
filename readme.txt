خريطة قاعدة البيانات (الكيانات - Entities)
الكيان (Entity)	السمات الرئيسية	العلاقات
User	id, created_date, updated_date, full_name, email, role, last_exchange_rate, default_currency, notification_settings (JSON Object)	
Wallet	id, created_date, updated_date, name, type, currency, initial_balance, owner_email, is_active	يرتبط بـ User (عبر owner_email)، Transaction، Budget، SavingsGoal
Transaction	id, created_date, updated_date, wallet_id, title, amount_syp, amount_usd, exchange_rate, primary_currency, type, category, family_member_id, transaction_date, notes, receipt_uri	يرتبط بـ Wallet، FamilyMember
RecurringTransaction	id, created_date, updated_date, wallet_id, title, amount_syp, amount_usd, exchange_rate, primary_currency, type, category, frequency, next_occurrence, is_active, family_member_id, wallet_owner	يرتبط بـ Wallet، FamilyMember، User (عبر wallet_owner)
Budget	id, created_date, updated_date, wallet_id, category, amount, month	يرتبط بـ Wallet
SavingsGoal	id, created_date, updated_date, wallet_id, title, target_amount, current_amount, target_date, description, category, is_active	يرتبط بـ Wallet، Investment (عدة استثمارات لهدف واحد)
FamilyMember	id, created_date, updated_date, name, relationship, date_of_birth, is_active, added_by	يرتبط بـ User (عبر added_by)، Transaction، RecurringTransaction
ExchangeRate	id, created_date, updated_date, rate, source, date	
Notification	id, created_date, updated_date, title, message, type, is_read, action_url, wallet_owner	يرتبط بـ User (عبر wallet_owner)
AIRecommendation	id, created_date, updated_date, type, title, description, impact, effort, estimated_savings, target_id, is_implemented, wallet_owner	يرتبط بـ User (عبر wallet_owner)، SavingsGoal، Debt
Investment	id, created_date, updated_date, wallet_owner, savings_goal_id, name, type, initial_amount, current_value, currency, purchase_date, risk_level, expected_return, notes, is_active, history (Array of {date, value})	يرتبط بـ User (عبر wallet_owner)، SavingsGoal (اختياري)
Debt	id, created_date, updated_date, name, type, original_amount, current_balance, minimum_payment, interest_rate, due_date, creditor, is_active, wallet_owner	يرتبط بـ User (عبر wallet_owner)
تدفق العمل: الواجهة الأمامية (Frontend Flow)
الوصول والتسجيل/تسجيل الدخول:

يصل المستخدم إلى التطبيق عبر المتصفح أو PWA.
يتم التعامل مع عملية التسجيل/تسجيل الدخول بواسطة منصة Base44.
لوحة التحكم (Dashboard):

بعد تسجيل الدخول، ينتقل المستخدم مباشرة إلى لوحة التحكم.
تعرض لوحة التحكم نظرة عامة على الوضع المالي: إحصائيات الدخل/المصروفات، الرصيد الكلي للمحفظة، عدد أفراد العائلة.
مخططات بيانية لتوجهات الإنفاق وتوزيع الفئات.
سعر الصرف المباشر.
إجراءات سريعة لإضافة معاملة جديدة أو إضافة فرد عائلة.
مكون RecurringProcessor يعمل في الخلفية لتنفيذ المعاملات المتكررة المستحقة.
التنقل الأساسي (Sidebar / Mobile Menu):

يستخدم المستخدم شريط التنقل الجانبي (أو قائمة الهاتف المحمول) للوصول إلى الأقسام المختلفة:
المحافظ (Wallets): يعرض قائمة المحافظ، يضيف أو يعدل المحافظ.
المعاملات (Transactions): يضيف، يعرض، يفلتر المعاملات. يمكنه إرفاق إيصالات.
المتكررة (Recurring): يضيف، يعرض، ويدير المعاملات المتكررة.
الميزانيات (Budgets): يضيف ميزانيات جديدة، يعرض تقدم الميزانيات الحالية.
أهداف الادخار (SavingsGoals): يضيف أهداف ادخارية، يتتبع التقدم، ويربطها بالمحافظ.
الاستثمارات (Investments): يضيف، يعرض، ويعدل الاستثمارات، يرى الرسوم البيانية للنمو، ويستخدم مستشار الذكاء الاصطناعي.
أفراد العائلة (Family): يضيف، يعرض أفراد العائلة.
مساعد الذكاء الاصطناعي (AIAssistant): يستخدم الذكاء الاصطناعي للحصول على نصائح مالية.
التقارير (Reports): يرى ملخصات وتحليلات مالية مختلفة.
الإعدادات (Settings): يخصص إعدادات الإشعارات.
النصوص التفاعلية (Forms & Modals):

عند اختيار إضافة أو تعديل أي عنصر (معاملة، محفظة، هدف، استثمار، إلخ)، تظهر نماذج مخصصة لإدخال البيانات.
تدعم هذه النماذج المدخلات المختلفة (نص، رقم، تاريخ، تحديد من قائمة، تحميل ملف).
الإشعارات (Notifications):

تعرض أيقونة الجرس في شريط الرأس عدد الإشعارات غير المقروءة.
يؤدي النقر عليها إلى فتح نافذة منبثقة (Popover) تعرض قائمة بالإشعارات.
يمكن للمستخدم النقر على الإشعار للانتقال إلى الصفحة ذات الصلة أو وضع علامة "مقروء".
PWA والتخصيص:

يمكن للمستخدم تثبيت التطبيق كـ PWA للحصول على تجربة متكاملة.
يمكنه تبديل لغة الواجهة (عربي/إنجليزي) من خلال أداة تبديل اللغة في شريط الرأس.
تدفق العمل: الواجهة الخلفية (Backend Flow)
تعتمد الواجهة الخلفية بشكل كامل على خدمات منصة Base44، مما يوفر بنية تحتية قوية لإدارة البيانات، المصادقة، والذكاء الاصطناعي.

المصادقة وإدارة المستخدمين (base44.auth):

يتعامل النظام مع تسجيل المستخدمين وتسجيل دخولهم.
يتم جلب بيانات المستخدم الحالية (base44.auth.me()) وتحديثها (base44.auth.updateMe()) بما في ذلك notification_settings المخصصة.
إدارة الكيانات (base44.entities):

العمليات الأساسية (CRUD): تقوم الواجهة الأمامية بإرسال طلبات لإنشاء، قراءة (تصفية)، تحديث، وحذف (غالبًا حذف منطقي عن طريق تعيين is_active إلى false) جميع الكيانات المخصصة المذكورة أعلاه (Wallet, Transaction, Budget, etc.).
الفلترة والاستعلام: تدعم أوامر الفلترة استعلامات معقدة لجلب البيانات المطلوبة، مثل Transaction.filter({ wallet: { owner_email: currentUser.email } }) لجلب معاملات المستخدم الحالي.
يتم تخزين جميع بيانات التطبيق بشكل آمن ومنظم في قاعدة بيانات Base44.
الذكاء الاصطناعي (base44.integrations.Core.InvokeLLM):

AI Assistant: عندما يطلب المستخدم نصيحة من مساعد الذكاء الاصطناعي (سواء لتحقيق الأهداف، سداد الديون، أو استشارات الاستثمار)، يقوم الواجهة الأمامية بتجميع البيانات ذات الصلة (أهداف الادخار، الديون، تفاصيل الاستثمارات) وإرسالها كـ prompt إلى InvokeLLM.
يتم تحديد response_json_schema لضمان الحصول على استجابة منظمة يمكن للتطبيق معالجتها وعرضها.
إدارة الملفات (base44.integrations.Core.UploadPrivateFile, CreateFileSignedUrl):

عند تحميل إيصالات المعاملات، يتم استخدام UploadPrivateFile لرفع الملفات بشكل آمن إلى مساحة التخزين الخاصة بالمستخدم.
عند الحاجة لعرض الإيصال، يتم إنشاء signed_url باستخدام CreateFileSignedUrl لضمان الوصول المؤقت والآمن.
مراقب الإشعارات (NotificationMonitor Component):

هذا المكون يعمل في الواجهة الأمامية (لكنه يحاكي وظيفة الخلفية بفضل طبيعة Base44 التي تجعل الاستدعاءات الخلفية سريعة).
كل 5 دقائق، يقوم NotificationMonitor بالاستعلام عن كيانات RecurringTransaction, Budget, SavingsGoal, Investment عبر base44.entities.
يقوم بتحليل البيانات لتحديد ما إذا كانت الشروط المحددة في user.notification_settings قد تحققت (مثل اقتراب تاريخ معاملة متكررة، تجاوز نسبة مئوية من الميزانية، تحقيق معلم هدف ادخاري/استثماري).
إذا تحققت الشروط ولم يتم إرسال إشعار مماثل مؤخرًا، يقوم NotificationMonitor بإنشاء كيان Notification جديد في قاعدة البيانات.
تظهر هذه الإشعارات بعد ذلك في NotificationCenter للمستخدم.