import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/shared/api/entities';
import { useAuth } from '@/features/auth/context/AuthContext';
import { addDays, addWeeks, addMonths, addYears, isBefore, parseISO } from 'date-fns';

function RecurringProcessor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: recurringTransactions } = useQuery({
    queryKey: ['recurring-transactions', 'processor', user?.email],
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

  const createTransactionMutation = useMutation({
    mutationFn: entities.transaction.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const updateRecurringMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      entities.recurringTransaction.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
    },
  });

  useEffect(() => {
    if (!recurringTransactions || recurringTransactions.length === 0) return;

    const processRecurringTransactions = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const recurring of recurringTransactions) {
        const nextOccurrence = parseISO(recurring.next_occurrence);
        nextOccurrence.setHours(0, 0, 0, 0);

        // Check if the next occurrence is today or in the past
        if (isBefore(nextOccurrence, today) || nextOccurrence.getTime() === today.getTime()) {
          // Create the transaction
          await createTransactionMutation.mutateAsync({
            wallet_id: recurring.wallet_id,
            title: recurring.title,
            amount_syp: recurring.amount_syp,
            amount_usd: recurring.amount_usd,
            exchange_rate: recurring.exchange_rate,
            primary_currency: recurring.primary_currency,
            type: recurring.type,
            category: recurring.category,
            family_member_id: recurring.family_member_id,
            transaction_date: today.toISOString().split('T')[0],
            notes: `Auto-generated from recurring transaction: ${recurring.title}`,
          });

          // Calculate next occurrence
          let newNextOccurrence: Date;
          switch (recurring.frequency) {
            case 'daily':
              newNextOccurrence = addDays(nextOccurrence, 1);
              break;
            case 'weekly':
              newNextOccurrence = addWeeks(nextOccurrence, 1);
              break;
            case 'monthly':
              newNextOccurrence = addMonths(nextOccurrence, 1);
              break;
            case 'yearly':
              newNextOccurrence = addYears(nextOccurrence, 1);
              break;
            default:
              newNextOccurrence = addMonths(nextOccurrence, 1);
          }

          // Update the recurring transaction
          await updateRecurringMutation.mutateAsync({
            id: recurring.id,
            data: { next_occurrence: newNextOccurrence.toISOString().split('T')[0] },
          });
        }
      }
    };

    processRecurringTransactions();
  }, [recurringTransactions]);

  // This component doesn't render anything
  return null;
}

export default RecurringProcessor;

