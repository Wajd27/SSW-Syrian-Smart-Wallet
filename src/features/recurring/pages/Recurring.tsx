import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { entities } from '@/shared/api/entities';
import { useAuth } from '@/features/auth/context/AuthContext';
import Card from '@/shared/components/Card/Card';
import Button from '@/shared/components/Button/Button';
import Modal from '@/shared/components/Modal/Modal';
import Input from '@/shared/components/Forms/Input';
import Select from '@/shared/components/Forms/Select';
import DatePicker from '@/shared/components/Forms/DatePicker';
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';
import PullToRefresh from '@/shared/components/PullToRefresh/PullToRefresh';
import { useToast } from '@/shared/hooks/useToast';
import InfoTooltip from '@/shared/components/InfoTooltip/InfoTooltip';
import { PlusIcon, PencilIcon, PlayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { RecurringTransaction } from '@/shared/types/entities';

function Recurring() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  
  // Get default exchange rate from user's last used rate
  const getDefaultExchangeRate = () => {
    return user?.last_exchange_rate || 13000;
  };
  
  const [formData, setFormData] = useState({
    wallet_id: '',
    title: '',
    amount_syp: 0,
    amount_usd: 0,
    exchange_rate: getDefaultExchangeRate(),
    primary_currency: 'SYP' as 'SYP' | 'USD',
    type: 'expense' as 'income' | 'expense',
    category: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    next_occurrence: '',
    family_member_id: '',
  });

  const { data: wallets } = useQuery({
    queryKey: ['wallets', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.wallet.filter({ owner_email: user.email, is_active: true });
    },
    enabled: !!user?.email,
  });

  const { data: familyMembers } = useQuery({
    queryKey: ['family-members', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.familyMember.filter({ added_by: user.email, is_active: true });
    },
    enabled: !!user?.email,
  });

  const { data: recurringTransactions, isLoading } = useQuery({
    queryKey: ['recurring-transactions', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.recurringTransaction.filter({ wallet_owner: user.email });
    },
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: entities.recurringTransaction.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      setIsModalOpen(false);
      resetForm();
      showSuccess(t('recurring.addRecurring') + ' ' + t('common.success'));
    },
    onError: (error: Error) => {
      showError(error.message || t('common.error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RecurringTransaction> }) =>
      entities.recurringTransaction.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      setIsModalOpen(false);
      setEditingRecurring(null);
      resetForm();
      showSuccess(t('recurring.editRecurring') + ' ' + t('common.success'));
    },
    onError: (error: Error) => {
      showError(error.message || t('common.error'));
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      entities.recurringTransaction.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      showSuccess(t('common.success'));
    },
    onError: (error: Error) => {
      showError(error.message || t('common.error'));
    },
  });

  const triggerNowMutation = useMutation({
    mutationFn: async (recurring: RecurringTransaction) => {
      // Create transaction immediately
      await entities.transaction.create({
        wallet_id: recurring.wallet_id,
        title: recurring.title,
        amount_syp: recurring.amount_syp,
        amount_usd: recurring.amount_usd,
        exchange_rate: recurring.exchange_rate,
        primary_currency: recurring.primary_currency,
        type: recurring.type,
        category: recurring.category,
        family_member_id: recurring.family_member_id,
        transaction_date: new Date().toISOString().split('T')[0],
        notes: `Manual trigger from recurring: ${recurring.title}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showSuccess(t('common.success'));
    },
    onError: (error: Error) => {
      showError(error.message || t('common.error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => entities.recurringTransaction.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showSuccess(t('common.delete') + ' ' + t('common.success'));
    },
    onError: (error: Error) => {
      showError(error.message || t('common.error'));
    },
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(t('common.confirmDelete', { name: title }))) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      wallet_id: '',
      title: '',
      amount_syp: 0,
      amount_usd: 0,
      exchange_rate: getDefaultExchangeRate(),
      primary_currency: 'SYP',
      type: 'expense',
      category: '',
      frequency: 'monthly',
      next_occurrence: '',
      family_member_id: '',
    });
  };

  const handleOpenModal = (recurring?: RecurringTransaction) => {
    if (recurring) {
      setEditingRecurring(recurring);
      setFormData({
        wallet_id: recurring.wallet_id,
        title: recurring.title,
        amount_syp: recurring.amount_syp,
        amount_usd: recurring.amount_usd,
        exchange_rate: recurring.exchange_rate,
        primary_currency: recurring.primary_currency,
        type: recurring.type,
        category: recurring.category || '',
        frequency: recurring.frequency,
        next_occurrence: recurring.next_occurrence,
        family_member_id: recurring.family_member_id || '',
      });
    } else {
      setEditingRecurring(null);
      resetForm();
      setFormData((prev) => ({
        ...prev,
        next_occurrence: new Date().toISOString().split('T')[0],
      }));
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecurring) {
      updateMutation.mutate({
        id: editingRecurring.id,
        data: formData,
      });
    } else {
      createMutation.mutate({
        ...formData,
        wallet_owner: user!.email,
        is_active: true,
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  return (
    <PullToRefresh queryKeys={['recurring-transactions', 'wallets', 'family-members']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <h1 className="text-2xl font-bold text-gray-900">{t('recurring.title')}</h1>
            <InfoTooltip content={t('recurring.info')} />
          </div>
        <Button onClick={() => handleOpenModal()}>
          <PlusIcon className="w-5 h-5 ml-2 rtl:ml-0 rtl:mr-2" />
          {t('recurring.addRecurring')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recurringTransactions?.map((recurring) => {
          const wallet = wallets?.find((w) => w.id === recurring.wallet_id);
          return (
            <Card key={recurring.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{recurring.title}</h3>
                  <p className="text-sm text-gray-500">{wallet?.name}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    recurring.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {recurring.is_active ? t('common.active') : t('common.inactive')}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  {t('recurring.frequency')}: {t(`recurring.${recurring.frequency}`)}
                </p>
                <p>
                  {t('recurring.nextOccurrence')}:{' '}
                  {new Date(recurring.next_occurrence).toLocaleDateString()}
                </p>
                <p>
                  {t('transactions.amount')}:{' '}
                  {recurring.primary_currency === 'USD'
                    ? recurring.amount_usd
                    : recurring.amount_syp}{' '}
                  {recurring.primary_currency}
                </p>
              </div>
              <div className="flex items-center space-x-2 mt-4 rtl:space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenModal(recurring)}
                >
                  <PencilIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    toggleActiveMutation.mutate({
                      id: recurring.id,
                      is_active: !recurring.is_active,
                    })
                  }
                >
                  {recurring.is_active ? t('common.deactivate') : t('common.activate')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(recurring.id, recurring.title)}
                  isLoading={deleteMutation.isPending}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
                {recurring.is_active && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => triggerNowMutation.mutate(recurring)}
                  >
                    <PlayIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {recurringTransactions?.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 py-8">{t('common.noData')}</p>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecurring(null);
          resetForm();
        }}
        title={editingRecurring ? t('recurring.editRecurring') : t('recurring.addRecurring')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label={t('wallets.title')}
            value={formData.wallet_id}
            onChange={(e) => setFormData({ ...formData, wallet_id: e.target.value })}
            options={[
              { value: '', label: t('common.select') },
              ...(wallets?.map((w) => ({ value: w.id, label: w.name })) || []),
            ]}
            required
          />
          <Input
            label={t('transactions.transactionTitle')}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('recurring.frequency')}
              value={formData.frequency}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  frequency: e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly',
                })
              }
              options={[
                { value: 'daily', label: t('recurring.daily') },
                { value: 'weekly', label: t('recurring.weekly') },
                { value: 'monthly', label: t('recurring.monthly') },
                { value: 'yearly', label: t('recurring.yearly') },
              ]}
            />
            <DatePicker
              label={t('recurring.nextOccurrence')}
              value={formData.next_occurrence}
              onChange={(e) => setFormData({ ...formData, next_occurrence: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('transactions.amountSYP')}
              type="number"
              step="0.01"
              value={formData.amount_syp}
              onChange={(e) =>
                setFormData({ ...formData, amount_syp: parseFloat(e.target.value) || 0 })
              }
            />
            <Input
              label={t('transactions.amountUSD')}
              type="number"
              step="0.01"
              value={formData.amount_usd}
              onChange={(e) =>
                setFormData({ ...formData, amount_usd: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <Select
            label={t('transactions.type')}
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })
            }
            options={[
              { value: 'income', label: t('transactions.income') },
              { value: 'expense', label: t('transactions.expense') },
            ]}
          />
          <Select
            label={t('family.title')}
            value={formData.family_member_id}
            onChange={(e) => setFormData({ ...formData, family_member_id: e.target.value })}
            options={[
              { value: '', label: t('common.none') },
              ...(familyMembers?.map((m) => ({ value: m.id, label: m.name })) || []),
            ]}
          />
          <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingRecurring(null);
                resetForm();
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
      </div>
    </PullToRefresh>
  );
}

export default Recurring;
