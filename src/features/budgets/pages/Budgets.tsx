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
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';
import PullToRefresh from '@/shared/components/PullToRefresh/PullToRefresh';
import { useFeedback } from '@/shared/hooks/useFeedback';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Budget } from '@/shared/types/entities';
import { formatCurrency } from '@/shared/lib/formatters';

function Budgets() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { triggerFeedback } = useFeedback();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    wallet_id: '',
    category: '',
    amount: 0,
    month: new Date().toISOString().slice(0, 7),
  });

  const { data: wallets } = useQuery({
    queryKey: ['wallets', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.wallet.filter({ owner_email: user.email, is_active: true });
    },
    enabled: !!user?.email,
  });

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets', user?.email],
    queryFn: async () => {
      if (!user?.email || !wallets) return [];
      const walletIds = wallets.map((w) => w.id);
      const allBudgets = await Promise.all(
        walletIds.map((id) => entities.budget.filter({ wallet_id: id }))
      );
      return allBudgets.flat();
    },
    enabled: !!user?.email && !!wallets,
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions', 'budgets', user?.email],
    queryFn: async () => {
      if (!user?.email || !wallets) return [];
      const walletIds = wallets.map((w) => w.id);
      const allTransactions = await Promise.all(
        walletIds.map((id) => entities.transaction.filter({ wallet_id: id }))
      );
      return allTransactions.flat();
    },
    enabled: !!user?.email && !!wallets,
  });

  const createMutation = useMutation({
    mutationFn: entities.budget.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsModalOpen(false);
      resetForm();
      triggerFeedback('success');
    },
    onError: () => {
      triggerFeedback('error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Budget> }) =>
      entities.budget.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsModalOpen(false);
      setEditingBudget(null);
      resetForm();
      triggerFeedback('success');
    },
    onError: () => {
      triggerFeedback('error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => entities.budget.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      triggerFeedback('success');
    },
    onError: () => {
      triggerFeedback('error');
    },
  });

  const handleDelete = (id: string, category: string, month: string) => {
    triggerFeedback('warning');
    if (window.confirm(t('common.confirmDelete', { name: `${category} - ${month}` }))) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      wallet_id: '',
      category: '',
      amount: 0,
      month: new Date().toISOString().slice(0, 7),
    });
  };

  const handleOpenModal = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        wallet_id: budget.wallet_id,
        category: budget.category,
        amount: budget.amount,
        month: budget.month,
      });
    } else {
      setEditingBudget(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBudget) {
      updateMutation.mutate({
        id: editingBudget.id,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getBudgetProgress = (budget: Budget) => {
    const monthTransactions =
      transactions?.filter(
        (t) =>
          t.wallet_id === budget.wallet_id &&
          t.transaction_date.startsWith(budget.month) &&
          t.type === 'expense' &&
          t.category === budget.category
      ) || [];
    const spent = monthTransactions.reduce(
      (sum, t) => sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp),
      0
    );
    const percentage = (spent / budget.amount) * 100;
    return { spent, percentage, remaining: budget.amount - spent };
  };

  const categories = [
    'Food',
    'Transport',
    'Utilities',
    'Entertainment',
    'Healthcare',
    'Education',
    'Shopping',
    'Other',
  ];

  if (isLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  return (
    <PullToRefresh queryKeys={['budgets', 'transactions', 'wallets']}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 drop-shadow-sm">{t('budgets.title')}</h1>
        <Button onClick={() => handleOpenModal()}>
          <PlusIcon className="w-5 h-5 ml-2 rtl:ml-0 rtl:mr-2" />
          {t('budgets.addBudget')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets?.map((budget, index) => {
          const wallet = wallets?.find((w) => w.id === budget.wallet_id);
          const progress = getBudgetProgress(budget);
          return (
            <Card
              key={budget.id}
              className="hover:shadow-lg transition-shadow animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{budget.category}</h3>
                <p className="text-sm text-gray-600">{wallet?.name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(budget.month + '-01').toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('budgets.budgetAmount')}:</span>
                  <span className="font-semibold">
                    {formatCurrency(budget.amount, wallet?.currency || 'SYP', i18n.language)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('budgets.spent')}:</span>
                  <span className="font-semibold">
                    {formatCurrency(progress.spent, wallet?.currency || 'SYP', i18n.language)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('budgets.remaining')}:</span>
                  <span
                    className={`font-semibold ${
                      progress.remaining < 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {formatCurrency(
                      progress.remaining,
                      wallet?.currency || 'SYP',
                      i18n.language
                    )}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{t('budgets.progress')}</span>
                    <span>{progress.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        progress.percentage > 100
                          ? 'bg-red-600'
                          : progress.percentage > 80
                          ? 'bg-yellow-600'
                          : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center space-x-2 rtl:space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenModal(budget)}
                  className="flex-1"
                >
                  <PencilIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(budget.id, budget.category, budget.month)}
                  isLoading={deleteMutation.isPending}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {budgets?.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 py-8">{t('common.noData')}</p>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
          resetForm();
        }}
        title={editingBudget ? t('budgets.editBudget') : t('budgets.addBudget')}
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
          <Select
            label={t('transactions.category')}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: '', label: t('common.select') },
              ...categories.map((cat) => ({ value: cat, label: cat })),
            ]}
            required
          />
          <Input
            label={t('budgets.budgetAmount')}
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
            }
            required
          />
          <Input
            label={t('budgets.month')}
            type="month"
            value={formData.month}
            onChange={(e) => setFormData({ ...formData, month: e.target.value })}
            required
          />
          <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingBudget(null);
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

export default Budgets;
