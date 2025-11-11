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
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Debt } from '@/shared/types/entities';
import { formatCurrency } from '@/shared/lib/formatters';

function Debts() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    original_amount: 0,
    current_balance: 0,
    minimum_payment: 0,
    interest_rate: 0,
    due_date: '',
    creditor: '',
    currency: user?.default_currency || 'SYP',
  });

  const { data: debts, isLoading } = useQuery({
    queryKey: ['debts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.debt.filter({ wallet_owner: user.email });
    },
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: entities.debt.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Debt> }) =>
      entities.debt.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      setIsModalOpen(false);
      setEditingDebt(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => entities.debt.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(t('common.confirmDelete', { name }))) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      original_amount: 0,
      current_balance: 0,
      minimum_payment: 0,
      interest_rate: 0,
      due_date: '',
      creditor: '',
      currency: user?.default_currency || 'SYP',
    });
  };

  const handleOpenModal = (debt?: Debt) => {
    if (debt) {
      setEditingDebt(debt);
      setFormData({
        name: debt.name,
        type: debt.type,
        original_amount: debt.original_amount,
        current_balance: debt.current_balance,
        minimum_payment: debt.minimum_payment,
        interest_rate: debt.interest_rate,
        due_date: debt.due_date,
        creditor: debt.creditor,
        currency: debt.currency || user?.default_currency || 'SYP',
      });
    } else {
      setEditingDebt(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDebt) {
      updateMutation.mutate({
        id: editingDebt.id,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('debts.title')}</h1>
        <Button onClick={() => handleOpenModal()}>
          <PlusIcon className="w-5 h-5 ml-2 rtl:ml-0 rtl:mr-2" />
          {t('debts.addDebt')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {debts?.map((debt) => {
          const paid = debt.original_amount - debt.current_balance;
          const paidPercentage = (paid / debt.original_amount) * 100;
          return (
            <Card key={debt.id} className="hover:shadow-lg transition-shadow">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{debt.name}</h3>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                    {debt.currency || user?.default_currency || 'SYP'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{debt.type}</p>
                <p className="text-xs text-gray-500">{debt.creditor}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('debts.originalAmount')}:</span>
                  <span className="font-semibold">
                    {formatCurrency(debt.original_amount, debt.currency || user?.default_currency || 'SYP', i18n.language)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('debts.currentBalance')}:</span>
                  <span className="font-semibold">
                    {formatCurrency(debt.current_balance, debt.currency || user?.default_currency || 'SYP', i18n.language)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('debts.minimumPayment')}:</span>
                  <span className="font-semibold">
                    {formatCurrency(debt.minimum_payment, debt.currency || user?.default_currency || 'SYP', i18n.language)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('debts.interestRate')}:</span>
                  <span className="font-semibold">{debt.interest_rate}%</span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Paid</span>
                    <span>{paidPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${paidPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center space-x-2 rtl:space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenModal(debt)}
                  className="flex-1"
                >
                  <PencilIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(debt.id, debt.name)}
                  isLoading={deleteMutation.isPending}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {debts?.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 py-8">{t('common.noData')}</p>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDebt(null);
          resetForm();
        }}
        title={editingDebt ? t('debts.editDebt') : t('debts.addDebt')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('debts.debtName')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label={t('debts.debtType')}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('debts.originalAmount')}
              type="number"
              step="0.01"
              value={formData.original_amount}
              onChange={(e) =>
                setFormData({ ...formData, original_amount: parseFloat(e.target.value) || 0 })
              }
              required
            />
            <Input
              label={t('debts.currentBalance')}
              type="number"
              step="0.01"
              value={formData.current_balance}
              onChange={(e) =>
                setFormData({ ...formData, current_balance: parseFloat(e.target.value) || 0 })
              }
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('debts.minimumPayment')}
              type="number"
              step="0.01"
              value={formData.minimum_payment}
              onChange={(e) =>
                setFormData({ ...formData, minimum_payment: parseFloat(e.target.value) || 0 })
              }
              required
            />
            <Input
              label={t('debts.interestRate')}
              type="number"
              step="0.01"
              value={formData.interest_rate}
              onChange={(e) =>
                setFormData({ ...formData, interest_rate: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <Input
            label={t('debts.creditor')}
            value={formData.creditor}
            onChange={(e) => setFormData({ ...formData, creditor: e.target.value })}
          />
          <Select
            label={t('wallets.currency')}
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            options={[
              { value: 'SYP', label: 'SYP' },
              { value: 'USD', label: 'USD' },
            ]}
            required
          />
          <DatePicker
            label={t('debts.dueDate')}
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
          <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingDebt(null);
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

export default Debts;
