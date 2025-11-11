import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { entities } from '@/shared/api/entities';
import { useAuth } from '@/features/auth/context/AuthContext';
import { filesApi } from '@/shared/api/files';
import Card from '@/shared/components/Card/Card';
import PullToRefresh from '@/shared/components/PullToRefresh/PullToRefresh';
import { useFeedback } from '@/shared/hooks/useFeedback';
import { useToast } from '@/shared/hooks/useToast';
import Button from '@/shared/components/Button/Button';
import Modal from '@/shared/components/Modal/Modal';
import Input from '@/shared/components/Forms/Input';
import Select from '@/shared/components/Forms/Select';
import DatePicker from '@/shared/components/Forms/DatePicker';
import FileUpload from '@/shared/components/Forms/FileUpload';
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Transaction as TransactionType } from '@/shared/types/entities';
import { formatCurrency } from '@/shared/lib/formatters';

function Transactions() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { triggerFeedback } = useFeedback();
  const { showSuccess, showError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'add');
  const [editingTransaction, setEditingTransaction] = useState<TransactionType | null>(null);
  const [filters, setFilters] = useState({
    wallet_id: '',
    type: '',
    category: '',
    start_date: '',
    end_date: '',
  });
  // Initialize form data with user's last exchange rate or fallback
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
    family_member_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: '',
    receipt: null as File | null,
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

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', user?.email, filters],
    queryFn: async () => {
      if (!user?.email || !wallets) return [];
      const walletIds = filters.wallet_id
        ? [filters.wallet_id]
        : wallets.map((w) => w.id);
      const allTransactions = await Promise.all(
        walletIds.map((id) =>
          entities.transaction.filter({
            wallet_id: id,
            ...(filters.type && { type: filters.type as 'income' | 'expense' }),
            ...(filters.category && { category: filters.category }),
            ...(filters.start_date && { start_date: filters.start_date }),
            ...(filters.end_date && { end_date: filters.end_date }),
          })
        )
      );
      return allTransactions.flat().sort((a, b) => 
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );
    },
    enabled: !!user?.email && !!wallets,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      let receiptUri = '';
      if (formData.receipt) {
        const uploadResult = await filesApi.uploadReceipt(formData.receipt);
        receiptUri = uploadResult.url;
      }
      return entities.transaction.create({ ...data, receipt_uri: receiptUri });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsModalOpen(false);
      resetForm();
      triggerFeedback('success');
      showSuccess(t('transactions.addTransaction') + ' ' + t('common.success'));
    },
    onError: (error: Error) => {
      triggerFeedback('error');
      showError(error.message || t('common.error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TransactionType> }) => {
      if (formData.receipt) {
        const uploadResult = await filesApi.uploadReceipt(formData.receipt);
        return entities.transaction.update(id, { ...data, receipt_uri: uploadResult.url });
      }
      return entities.transaction.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsModalOpen(false);
      setEditingTransaction(null);
      resetForm();
      triggerFeedback('success');
      showSuccess(t('transactions.editTransaction') + ' ' + t('common.success'));
    },
    onError: (error: Error) => {
      triggerFeedback('error');
      showError(error.message || t('common.error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => entities.transaction.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      triggerFeedback('success');
      showSuccess(t('common.delete') + ' ' + t('common.success'));
    },
    onError: (error: Error) => {
      triggerFeedback('error');
      showError(error.message || t('common.error'));
    },
  });

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
      family_member_id: '',
      transaction_date: new Date().toISOString().split('T')[0],
      notes: '',
      receipt: null,
    });
  };

  const handleOpenModal = (transaction?: TransactionType) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        wallet_id: transaction.wallet_id,
        title: transaction.title,
        amount_syp: transaction.amount_syp,
        amount_usd: transaction.amount_usd,
        exchange_rate: transaction.exchange_rate,
        primary_currency: transaction.primary_currency,
        type: transaction.type,
        category: transaction.category || '',
        family_member_id: transaction.family_member_id || '',
        transaction_date: transaction.transaction_date,
        notes: transaction.notes || '',
        receipt: null,
      });
    } else {
      setEditingTransaction(null);
      resetForm();
      // Use user's last exchange rate as default (not live API rate)
      const defaultRate = user?.last_exchange_rate || 13000;
      setFormData((prev) => ({ ...prev, exchange_rate: defaultRate }));
    }
    setIsModalOpen(true);
  };

  const handleAmountChange = (value: string, currency: 'SYP' | 'USD') => {
    const amount = parseFloat(value) || 0;
    if (currency === 'SYP') {
      setFormData((prev) => ({
        ...prev,
        amount_syp: amount,
        amount_usd: amount / prev.exchange_rate,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        amount_usd: amount,
        amount_syp: amount * prev.exchange_rate,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      family_member_id: formData.family_member_id || undefined,
    };
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
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
    <PullToRefresh
      queryKeys={['transactions', 'wallets']}
      onRefresh={async () => {
        if (user?.email && wallets) {
          const walletIds = wallets.map((w) => w.id);
          await Promise.all(walletIds.map((id) => entities.transaction.filter({ wallet_id: id })));
        }
      }}
    >
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 drop-shadow-sm">{t('transactions.title')}</h1>
        <Button onClick={() => handleOpenModal()}>
          <PlusIcon className="w-5 h-5 ml-2 rtl:ml-0 rtl:mr-2" />
          {t('transactions.addTransaction')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select
            label={t('wallets.title')}
            value={filters.wallet_id}
            onChange={(e) => setFilters({ ...filters, wallet_id: e.target.value })}
            options={[
              { value: '', label: t('common.all') },
              ...(wallets?.map((w) => ({ value: w.id, label: w.name })) || []),
            ]}
          />
          <Select
            label={t('transactions.type')}
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            options={[
              { value: '', label: t('common.all') },
              { value: 'income', label: t('transactions.income') },
              { value: 'expense', label: t('transactions.expense') },
            ]}
          />
          <Input
            label={t('transactions.category')}
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            placeholder={t('common.search')}
          />
          <DatePicker
            label={t('common.startDate')}
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
          />
          <DatePicker
            label={t('common.endDate')}
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
          />
        </div>
      </Card>

      {/* Transactions List */}
      <div className="space-y-4">
        {transactions?.map((transaction, index) => {
          const wallet = wallets?.find((w) => w.id === transaction.wallet_id);
          const amount =
            transaction.primary_currency === 'USD'
              ? transaction.amount_usd
              : transaction.amount_syp;
          return (
            <Card
              key={transaction.id}
              className="hover:shadow-md transition-shadow animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {transaction.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        transaction.type === 'income'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {transaction.type === 'income'
                        ? t('transactions.income')
                        : t('transactions.expense')}
                    </span>
                  </div>
                  <p className="text-2xl font-bold mt-2">
                    {formatCurrency(
                      amount,
                      transaction.primary_currency,
                      i18n.language
                    )}
                  </p>
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p>
                      {t('wallets.title')}: {wallet?.name || 'N/A'}
                    </p>
                    {transaction.category && (
                      <p>
                        {t('transactions.category')}: {transaction.category}
                      </p>
                    )}
                    <p>
                      {t('transactions.transactionDate')}:{' '}
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                    </p>
                    {transaction.notes && <p>{transaction.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal(transaction)}
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => deleteMutation.mutate(transaction.id)}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {transactions?.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 py-8">{t('common.noData')}</p>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
          resetForm();
          setSearchParams({});
        }}
        title={
          editingTransaction ? t('transactions.editTransaction') : t('transactions.addTransaction')
        }
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
              label={t('transactions.primaryCurrency')}
              value={formData.primary_currency}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  primary_currency: e.target.value as 'SYP' | 'USD',
                })
              }
              options={[
                { value: 'SYP', label: 'SYP' },
                { value: 'USD', label: 'USD' },
              ]}
            />
            <Input
              label={t('transactions.exchangeRate')}
              type="number"
              step="0.01"
              value={formData.exchange_rate}
              onChange={(e) =>
                setFormData({ ...formData, exchange_rate: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('transactions.amountSYP')}
              type="number"
              step="0.01"
              value={formData.amount_syp}
              onChange={(e) => handleAmountChange(e.target.value, 'SYP')}
              required
            />
            <Input
              label={t('transactions.amountUSD')}
              type="number"
              step="0.01"
              value={formData.amount_usd}
              onChange={(e) => handleAmountChange(e.target.value, 'USD')}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
              label={t('transactions.category')}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: '', label: t('common.select') },
                ...categories.map((cat) => ({ value: cat, label: cat })),
              ]}
            />
          </div>
          <Select
            label={t('family.title')}
            value={formData.family_member_id}
            onChange={(e) => setFormData({ ...formData, family_member_id: e.target.value })}
            options={[
              { value: '', label: t('common.none') },
              ...(familyMembers?.map((m) => ({ value: m.id, label: m.name })) || []),
            ]}
          />
          <DatePicker
            label={t('transactions.transactionDate')}
            value={formData.transaction_date}
            onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
            required
          />
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
          <FileUpload
            label={t('transactions.receipt')}
            value={formData.receipt}
            onChange={(file) => setFormData({ ...formData, receipt: file })}
          />
          <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingTransaction(null);
                resetForm();
                setSearchParams({});
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
      </div>
    </PullToRefresh>
  );
}

export default Transactions;
