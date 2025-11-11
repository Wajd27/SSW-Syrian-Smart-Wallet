import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/shared/api/entities';
import { useAuth } from '@/features/auth/context/AuthContext';
import { parseISO } from 'date-fns';

function NotificationMonitor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userData } = useQuery({
    queryKey: ['user', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      // In a real app, fetch user with notification settings
      return user;
    },
    enabled: !!user?.email,
  });

  const { data: recurringTransactions } = useQuery({
    queryKey: ['recurring-transactions', 'monitor', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.recurringTransaction.filter({
        wallet_owner: user.email,
        is_active: true,
      });
    },
    enabled: !!user?.email,
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  const { data: budgets } = useQuery({
    queryKey: ['budgets', 'monitor', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const wallets = await entities.wallet.filter({ owner_email: user.email, is_active: true });
      const walletIds = wallets.map((w) => w.id);
      const allBudgets = await Promise.all(
        walletIds.map((id) => entities.budget.filter({ wallet_id: id }))
      );
      return allBudgets.flat();
    },
    enabled: !!user?.email,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions', 'monitor', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const wallets = await entities.wallet.filter({ owner_email: user.email, is_active: true });
      const walletIds = wallets.map((w) => w.id);
      const allTransactions = await Promise.all(
        walletIds.map((id) => entities.transaction.filter({ wallet_id: id }))
      );
      return allTransactions.flat();
    },
    enabled: !!user?.email,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: savingsGoals } = useQuery({
    queryKey: ['savings-goals', 'monitor', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const wallets = await entities.wallet.filter({ owner_email: user.email, is_active: true });
      const walletIds = wallets.map((w) => w.id);
      const allGoals = await Promise.all(
        walletIds.map((id) => entities.savingsGoal.filter({ wallet_id: id, is_active: true }))
      );
      return allGoals.flat();
    },
    enabled: !!user?.email,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: investments } = useQuery({
    queryKey: ['investments', 'monitor', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.investment.filter({ wallet_owner: user.email, is_active: true });
    },
    enabled: !!user?.email,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: existingNotifications } = useQuery({
    queryKey: ['notifications', 'recent', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.notification.filter({
        wallet_owner: user.email,
      });
    },
    enabled: !!user?.email,
  });

  const createNotificationMutation = useMutation({
    mutationFn: entities.notification.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  useEffect(() => {
    if (!user?.email || !userData) return;

    const checkNotifications = async () => {
      const notificationSettings = userData.notification_settings || {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check recurring transactions
      if (notificationSettings.recurring_reminders !== false) {
        recurringTransactions?.forEach(async (recurring) => {
          const nextOccurrence = parseISO(recurring.next_occurrence);
          const daysUntil = Math.ceil(
            (nextOccurrence.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntil <= 3 && daysUntil >= 0) {
            // Check if notification already exists
            const existing = existingNotifications?.find(
              (n) =>
                n.type === 'recurring_reminder' &&
                n.action_url?.includes(`recurring=${recurring.id}`) &&
                !n.is_read
            );

            if (!existing) {
              await createNotificationMutation.mutateAsync({
                title: 'Recurring Transaction Reminder',
                message: `${recurring.title} is due in ${daysUntil} day(s)`,
                type: 'recurring_reminder',
                is_read: false,
                action_url: `/recurring?id=${recurring.id}`,
                wallet_owner: user.email,
              });
            }
          }
        });
      }

      // Check budgets
      if (notificationSettings.budget_alerts !== false && budgets && transactions) {
        const threshold = notificationSettings.budget_threshold || 80;
        const currentMonth = new Date().toISOString().slice(0, 7);
        const currentMonthBudgets = budgets.filter((b) => b.month === currentMonth);

        currentMonthBudgets.forEach(async (budget) => {
          const budgetTransactions = transactions.filter(
            (t) =>
              t.wallet_id === budget.wallet_id &&
              t.transaction_date?.startsWith(budget.month) &&
              t.type === 'expense' &&
              t.category === budget.category
          );
          const spent = budgetTransactions.reduce(
            (sum, t) => sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp),
            0
          );
          const percentage = (spent / budget.amount) * 100;

          // Check for 50%, threshold (default 80%), and 100%
          const thresholds = [50, threshold, 100];
          for (const checkThreshold of thresholds) {
            if (
              percentage >= checkThreshold &&
              percentage < checkThreshold + 5 &&
              !existingNotifications?.find(
                (n) =>
                  n.type === 'budget_alert' &&
                  n.action_url?.includes(`budget=${budget.id}`) &&
                  n.message?.includes(`${checkThreshold}%`)
              )
            ) {
              await createNotificationMutation.mutateAsync({
                title: 'Budget Alert',
                message: `Budget for ${budget.category} has reached ${checkThreshold}% (${percentage.toFixed(1)}%)`,
                type: 'budget_alert',
                is_read: false,
                action_url: `/budgets?id=${budget.id}`,
                wallet_owner: user.email,
              });
              break; // Only create one notification per budget check
            }
          }
        });
      }

      // Check savings goals milestones
      if (notificationSettings.savings_milestones !== false) {
        savingsGoals?.forEach(async (goal) => {
          const progress = (goal.current_amount / goal.target_amount) * 100;
          if (progress >= 50 && progress < 60) {
            const existing = existingNotifications?.find(
              (n) =>
                n.type === 'savings_milestone' &&
                n.action_url?.includes(`goal=${goal.id}`) &&
                !n.is_read
            );

            if (!existing) {
              await createNotificationMutation.mutateAsync({
                title: 'Savings Goal Milestone',
                message: `You've reached 50% of your ${goal.title} goal!`,
                type: 'savings_milestone',
                is_read: false,
                action_url: `/savings-goals?id=${goal.id}`,
                wallet_owner: user.email,
              });
            }
          }
        });
      }
    };

    checkNotifications();
  }, [
    recurringTransactions,
    budgets,
    transactions,
    savingsGoals,
    investments,
    userData,
    existingNotifications,
  ]);

  return null; // This component doesn't render anything
}

export default NotificationMonitor;

