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
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { SavingsGoal } from '@/shared/types/entities';
import { formatCurrency } from '@/shared/lib/formatters';

function SavingsGoals() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [formData, setFormData] = useState({
    wallet_id: '',
    title: '',
    target_amount: 0,
    current_amount: 0,
    target_date: '',
    description: '',
    category: '',
  });

  const { data: wallets } = useQuery({
    queryKey: ['wallets', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.wallet.filter({ owner_email: user.email, is_active: true });
    },
    enabled: !!user?.email,
  });

  const { data: goals, isLoading } = useQuery({
    queryKey: ['savings-goals', user?.email],
    queryFn: async () => {
      if (!user?.email || !wallets) return [];
      const walletIds = wallets.map((w) => w.id);
      const allGoals = await Promise.all(
        walletIds.map((id) => entities.savingsGoal.filter({ wallet_id: id }))
      );
      return allGoals.flat();
    },
    enabled: !!user?.email && !!wallets,
  });

  const createMutation = useMutation({
    mutationFn: entities.savingsGoal.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SavingsGoal> }) =>
      entities.savingsGoal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
      setIsModalOpen(false);
      setEditingGoal(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      wallet_id: '',
      title: '',
      target_amount: 0,
      current_amount: 0,
      target_date: '',
      description: '',
      category: '',
    });
  };

  const handleOpenModal = (goal?: SavingsGoal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        wallet_id: goal.wallet_id,
        title: goal.title,
        target_amount: goal.target_amount,
        current_amount: goal.current_amount,
        target_date: goal.target_date,
        description: goal.description || '',
        category: goal.category,
      });
    } else {
      setEditingGoal(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGoal) {
      updateMutation.mutate({
        id: editingGoal.id,
        data: formData,
      });
    } else {
      createMutation.mutate({
        ...formData,
        is_active: true,
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('savingsGoals.title')}</h1>
        <Button onClick={() => handleOpenModal()}>
          <PlusIcon className="w-5 h-5 ml-2 rtl:ml-0 rtl:mr-2" />
          {t('savingsGoals.addGoal')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals?.map((goal) => {
          const wallet = wallets?.find((w) => w.id === goal.wallet_id);
          const progress = (goal.current_amount / goal.target_amount) * 100;
          return (
            <Card key={goal.id} className="hover:shadow-lg transition-shadow">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                <p className="text-sm text-gray-500">{wallet?.name}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('savingsGoals.targetAmount')}:</span>
                  <span className="font-semibold">
                    {formatCurrency(goal.target_amount, wallet?.currency || 'SYP', i18n.language)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('savingsGoals.currentAmount')}:</span>
                  <span className="font-semibold">
                    {formatCurrency(goal.current_amount, wallet?.currency || 'SYP', i18n.language)}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{t('savingsGoals.progress')}</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenModal(goal)}
                  className="w-full"
                >
                  <PencilIcon className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2" />
                  {t('common.edit')}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {goals?.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 py-8">{t('common.noData')}</p>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGoal(null);
          resetForm();
        }}
        title={editingGoal ? t('savingsGoals.editGoal') : t('savingsGoals.addGoal')}
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
            label={t('savingsGoals.goalTitle')}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('savingsGoals.targetAmount')}
              type="number"
              step="0.01"
              value={formData.target_amount}
              onChange={(e) =>
                setFormData({ ...formData, target_amount: parseFloat(e.target.value) || 0 })
              }
              required
            />
            <Input
              label={t('savingsGoals.currentAmount')}
              type="number"
              step="0.01"
              value={formData.current_amount}
              onChange={(e) =>
                setFormData({ ...formData, current_amount: parseFloat(e.target.value) || 0 })
              }
              required
            />
          </div>
          <DatePicker
            label={t('savingsGoals.targetDate')}
            value={formData.target_date}
            onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
            required
          />
          <Input
            label={t('transactions.category')}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />
          <textarea
            className="input"
            label={t('savingsGoals.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
          <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingGoal(null);
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
  );
}

export default SavingsGoals;
