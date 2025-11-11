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
import LineChart from '@/shared/components/Charts/LineChart';
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';
import PullToRefresh from '@/shared/components/PullToRefresh/PullToRefresh';
import { useToast } from '@/shared/hooks/useToast';
import InfoTooltip from '@/shared/components/InfoTooltip/InfoTooltip';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Investment } from '@/shared/types/entities';
import { formatCurrency } from '@/shared/lib/formatters';

function Investments() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [formData, setFormData] = useState({
    savings_goal_id: '',
    name: '',
    type: '',
    initial_amount: 0,
    current_value: 0,
    currency: 'SYP',
    purchase_date: new Date().toISOString().split('T')[0],
    risk_level: 'medium' as 'low' | 'medium' | 'high',
    expected_return: 0,
    notes: '',
  });

  const { data: savingsGoals } = useQuery({
    queryKey: ['savings-goals', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const wallets = await entities.wallet.filter({ owner_email: user.email, is_active: true });
      const walletIds = wallets.map((w) => w.id);
      const allGoals = await Promise.all(
        walletIds.map((id) => entities.savingsGoal.filter({ wallet_id: id }))
      );
      return allGoals.flat();
    },
    enabled: !!user?.email,
    refetchOnMount: true,
  });

  const { data: investments, isLoading } = useQuery({
    queryKey: ['investments', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.investment.filter({ wallet_owner: user.email });
    },
    enabled: !!user?.email,
    refetchOnMount: true,
  });

  const createMutation = useMutation({
    mutationFn: entities.investment.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      setIsModalOpen(false);
      resetForm();
      showSuccess(t('investments.addInvestment') + ' ' + t('common.success'));
    },
    onError: (error: Error) => {
      showError(error.message || t('common.error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Investment> }) =>
      entities.investment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      setIsModalOpen(false);
      setEditingInvestment(null);
      resetForm();
      showSuccess(t('investments.editInvestment') + ' ' + t('common.success'));
    },
    onError: (error: Error) => {
      showError(error.message || t('common.error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => entities.investment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showSuccess(t('common.delete') + ' ' + t('common.success'));
    },
    onError: (error: Error) => {
      showError(error.message || t('common.error'));
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(t('common.confirmDelete', { name }))) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      savings_goal_id: '',
      name: '',
      type: '',
      initial_amount: 0,
      current_value: 0,
      currency: 'SYP',
      purchase_date: new Date().toISOString().split('T')[0],
      risk_level: 'medium',
      expected_return: 0,
      notes: '',
    });
  };

  const handleOpenModal = (investment?: Investment) => {
    if (investment) {
      setEditingInvestment(investment);
      setFormData({
        savings_goal_id: investment.savings_goal_id || '',
        name: investment.name,
        type: investment.type,
        initial_amount: investment.initial_amount,
        current_value: investment.current_value,
        currency: investment.currency,
        purchase_date: investment.purchase_date,
        risk_level: investment.risk_level,
        expected_return: investment.expected_return || 0,
        notes: investment.notes || '',
      });
    } else {
      setEditingInvestment(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingInvestment) {
      updateMutation.mutate({
        id: editingInvestment.id,
        data: {
          ...formData,
          savings_goal_id: formData.savings_goal_id || undefined,
        },
      });
    } else {
      createMutation.mutate({
        ...formData,
        wallet_owner: user!.email,
        is_active: true,
        history: [],
        savings_goal_id: formData.savings_goal_id || undefined,
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  return (
    <PullToRefresh queryKeys={['investments', 'savings-goals', 'wallets']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('investments.title')}</h1>
            <InfoTooltip content={t('investments.info')} />
          </div>
          <Button 
            onClick={() => handleOpenModal()}
            size="sm"
            className="w-full sm:w-auto"
          >
            <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-2 rtl:ml-0 rtl:mr-2" />
            <span className="hidden sm:inline">{t('investments.addInvestment')}</span>
            <span className="sm:hidden">{t('investments.add') || 'Add'}</span>
          </Button>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {investments?.map((investment) => {
          const goal = savingsGoals?.find((g) => g.id === investment.savings_goal_id);
          const returnPercentage =
            ((investment.current_value - investment.initial_amount) / investment.initial_amount) *
            100;
          const chartData = investment.history.length > 0
            ? investment.history.map((h: { date: string; value: number }) => ({
                name: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: h.value,
              }))
            : [
                {
                  name: new Date(investment.purchase_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  }),
                  value: investment.initial_amount,
                },
                {
                  name: 'Now',
                  value: investment.current_value,
                },
              ];

          return (
            <Card key={investment.id} className="hover:shadow-lg transition-shadow">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{investment.name}</h3>
                <p className="text-sm text-gray-500">{investment.type}</p>
                {goal && <p className="text-xs text-gray-400">{goal.title}</p>}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('investments.initialAmount')}:</span>
                  <span className="font-semibold">
                    {formatCurrency(investment.initial_amount, investment.currency, i18n.language)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('investments.currentValue')}:</span>
                  <span
                    className={`font-semibold ${
                      returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(investment.current_value, investment.currency, i18n.language)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('investments.riskLevel')}:</span>
                  <span className="font-semibold">{t(`investments.${investment.risk_level}`)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Return:</span>
                  <span
                    className={`font-semibold ${
                      returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {returnPercentage >= 0 ? '+' : ''}
                    {returnPercentage.toFixed(2)}%
                  </span>
                </div>
              </div>
              {chartData.length > 0 && (
                <div className="mt-4">
                  <LineChart data={chartData} dataKeys={['value']} height={150} />
                </div>
              )}
              <div className="mt-4 flex items-center space-x-2 rtl:space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenModal(investment)}
                  className="flex-1"
                >
                  <PencilIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(investment.id, investment.name)}
                  isLoading={deleteMutation.isPending}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {investments?.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 py-8">{t('common.noData')}</p>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingInvestment(null);
          resetForm();
        }}
        title={
          editingInvestment ? t('investments.editInvestment') : t('investments.addInvestment')
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label={t('savingsGoals.title')}
            value={formData.savings_goal_id}
            onChange={(e) => setFormData({ ...formData, savings_goal_id: e.target.value })}
            options={[
              { value: '', label: t('common.none') },
              ...(savingsGoals?.map((g) => ({ value: g.id, label: g.title })) || []),
            ]}
          />
          <Input
            label={t('investments.investmentName')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label={t('investments.investmentType')}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('investments.initialAmount')}
              type="number"
              step="0.01"
              value={formData.initial_amount}
              onChange={(e) =>
                setFormData({ ...formData, initial_amount: parseFloat(e.target.value) || 0 })
              }
              required
            />
            <Input
              label={t('investments.currentValue')}
              type="number"
              step="0.01"
              value={formData.current_value}
              onChange={(e) =>
                setFormData({ ...formData, current_value: parseFloat(e.target.value) || 0 })
              }
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('wallets.currency')}
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              options={[
                { value: 'SYP', label: 'SYP' },
                { value: 'USD', label: 'USD' },
              ]}
            />
            <Select
              label={t('investments.riskLevel')}
              value={formData.risk_level}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  risk_level: e.target.value as 'low' | 'medium' | 'high',
                })
              }
              options={[
                { value: 'low', label: t('investments.low') },
                { value: 'medium', label: t('investments.medium') },
                { value: 'high', label: t('investments.high') },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              label={t('investments.purchaseDate')}
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              required
            />
            <Input
              label={t('investments.expectedReturn')}
              type="number"
              step="0.01"
              value={formData.expected_return}
              onChange={(e) =>
                setFormData({ ...formData, expected_return: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('transactions.notes')}
            </label>
            <textarea
              className="input"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingInvestment(null);
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

export default Investments;
