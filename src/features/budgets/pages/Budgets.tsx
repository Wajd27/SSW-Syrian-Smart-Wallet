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
import { useFeedback } from '@/shared/hooks/useFeedback';
import { useToast } from '@/shared/hooks/useToast';
import InfoTooltip from '@/shared/components/InfoTooltip/InfoTooltip';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Budget } from '@/shared/types/entities';
import { formatCurrency } from '@/shared/lib/formatters';

function Budgets() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { triggerFeedback } = useFeedback();
  const { showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    wallet_id: '',
    category: '',
    amount: 0,
    month: new Date().toISOString().slice(0, 7),
    family_member_id: '',
  });

  const [templateForm, setTemplateForm] = useState({
    wallet_id: '',
    month: new Date().toISOString().slice(0, 7),
    total_budget: 0,
    template: '50-30-20',
  });

  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ['wallets', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.wallet.filter({ owner_email: user.email, is_active: true });
    },
    enabled: !!user?.email,
    refetchOnMount: true,
  });

  const { data: familyMembers } = useQuery({
    queryKey: ['family-members', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.familyMember.filter({ added_by: user.email, is_active: true });
    },
    enabled: !!user?.email,
    refetchOnMount: true,
  });

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets', user?.email],
    queryFn: async () => {
      if (!user?.email || !wallets || wallets.length === 0) return [];
      const walletIds = wallets.map((w) => w.id);
      const allBudgets = await Promise.all(
        walletIds.map((id) => entities.budget.filter({ wallet_id: id }))
      );
      return allBudgets.flat();
    },
    enabled: !!user?.email && !!wallets && wallets.length > 0 && !walletsLoading,
    refetchOnMount: true,
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions', 'budgets', user?.email],
    queryFn: async () => {
      if (!user?.email || !wallets || wallets.length === 0) return [];
      const walletIds = wallets.map((w) => w.id);
      const allTransactions = await Promise.all(
        walletIds.map((id) => entities.transaction.filter({ wallet_id: id }))
      );
      return allTransactions.flat();
    },
    enabled: !!user?.email && !!wallets && wallets.length > 0 && !walletsLoading,
    refetchOnMount: true,
  });

  const createMutation = useMutation({
    mutationFn: entities.budget.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsModalOpen(false);
      resetForm();
      triggerFeedback('success');
      showSuccess(t('budgets.addBudget') + ' ' + t('common.success'));
    },
    onError: (error: Error) => {
      triggerFeedback('error');
      showError(error.message || t('common.error'));
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
      showSuccess(t('budgets.editBudget') + ' ' + t('common.success'));
    },
    onError: (error: Error) => {
      triggerFeedback('error');
      showError(error.message || t('common.error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => entities.budget.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      triggerFeedback('success');
      showSuccess(t('common.delete') + ' ' + t('common.success'));
    },
    onError: (error: Error) => {
      triggerFeedback('error');
      showError(error.message || t('common.error'));
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
      family_member_id: '',
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
        family_member_id: budget.family_member_id || '',
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
          t.category === budget.category &&
          (budget.family_member_id ? t.family_member_id === budget.family_member_id : !t.family_member_id)
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

  const budgetTemplates: Record<string, { label: string; allocations: { category: string; percent: number }[] }> = {
    '50-30-20': {
      label: '50/30/20',
      allocations: [
        { category: 'Utilities', percent: 20 },
        { category: 'Food', percent: 20 },
        { category: 'Transport', percent: 10 },
        { category: 'Healthcare', percent: 5 },
        { category: 'Education', percent: 5 },
        { category: 'Shopping', percent: 10 },
        { category: 'Entertainment', percent: 10 },
        { category: 'Other', percent: 20 },
      ],
    },
    essentials_saver: {
      label: 'Essentials Saver',
      allocations: [
        { category: 'Utilities', percent: 25 },
        { category: 'Food', percent: 25 },
        { category: 'Transport', percent: 15 },
        { category: 'Healthcare', percent: 10 },
        { category: 'Education', percent: 5 },
        { category: 'Shopping', percent: 5 },
        { category: 'Entertainment', percent: 5 },
        { category: 'Other', percent: 10 },
      ],
    },
  };

  const applyTemplate = async () => {
    try {
      if (!templateForm.wallet_id || !templateForm.month || templateForm.total_budget <= 0) {
        showError(t('common.error'));
        return;
      }
      const tmpl = budgetTemplates[templateForm.template];
      const creations = tmpl.allocations.map((alloc) =>
        entities.budget.create({
          wallet_id: templateForm.wallet_id,
          category: alloc.category,
          amount: Math.round((templateForm.total_budget * alloc.percent) / 100),
          month: templateForm.month,
        })
      );
      await Promise.all(creations);
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsTemplateModalOpen(false);
      showSuccess(t('common.success'));
    } catch (e: any) {
      showError(e?.message || t('common.error'));
    }
  };

  const copyLastMonth = async () => {
    try {
      if (!wallets || wallets.length === 0) return;
      const targetMonth = new Date().toISOString().slice(0, 7);
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      const lastMonth = lastMonthDate.toISOString().slice(0, 7);

      // Copy for each wallet individually
      const ops: Promise<any>[] = [];
      for (const w of wallets) {
        const prev = (await entities.budget.filter({ wallet_id: w.id })) as Budget[];
        const prevMonthBudgets = prev.filter((b) => b.month === lastMonth);
        // Avoid duplicates
        const existing = prev.filter((b) => b.month === targetMonth);
        const existingKey = new Set(existing.map((b) => `${b.category}`));
        prevMonthBudgets.forEach((b) => {
          const key = `${b.category}`;
          if (!existingKey.has(key)) {
            ops.push(
              entities.budget.create({
                wallet_id: w.id,
                category: b.category,
                amount: b.amount,
                month: targetMonth,
              })
            );
          }
        });
      }
      await Promise.all(ops);
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      showSuccess(t('common.success'));
    } catch (e: any) {
      showError(e?.message || t('common.error'));
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 drop-shadow-sm">{t('budgets.title')}</h1>
              <InfoTooltip content={t('budgets.info')} />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 sm:justify-end">
            <Button 
              variant="secondary" 
              onClick={() => setIsTemplateModalOpen(true)}
              size="sm"
              className="w-full sm:w-auto"
            >
              <span className="text-xs sm:text-sm">{t('budgets.useTemplate') || 'Use Template'}</span>
            </Button>
            <Button 
              variant="secondary" 
              onClick={copyLastMonth}
              size="sm"
              className="w-full sm:w-auto"
            >
              <span className="text-xs sm:text-sm">{t('budgets.copyLastMonth') || 'Copy Last Month'}</span>
            </Button>
            <Button 
              onClick={() => handleOpenModal()}
              size="sm"
              className="w-full sm:w-auto"
            >
              <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-2 rtl:ml-0 rtl:mr-2" />
              <span className="hidden sm:inline">{t('budgets.addBudget')}</span>
              <span className="sm:hidden">{t('common.add')}</span>
            </Button>
          </div>
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
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{budget.category}</h3>
                    <p className="text-sm text-gray-600">{wallet?.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(budget.month + '-01').toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  {budget.family_member_id && (
                    <span className="px-2 py-1 text-xs rounded-full bg-chip-bg border border-chip-border text-chip-text font-medium">
                      👤 {familyMembers?.find((m) => m.id === budget.family_member_id)?.name || t('family.member')}
                    </span>
                  )}
                </div>
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
          <Select
            label={t('family.filterByMember')}
            value={formData.family_member_id}
            onChange={(e) => setFormData({ ...formData, family_member_id: e.target.value })}
            options={[
              { value: '', label: t('family.ownerOnly') },
              ...(familyMembers?.map((m) => ({ value: m.id, label: m.name })) || []),
            ]}
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

      {/* Template Modal */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title={t('budgets.useTemplate') || 'Use Template'}
      >
        <div className="space-y-4">
          <Select
            label={t('wallets.title')}
            value={templateForm.wallet_id}
            onChange={(e) => setTemplateForm({ ...templateForm, wallet_id: e.target.value })}
            options={[
              { value: '', label: t('common.select') },
              ...(wallets?.map((w) => ({ value: w.id, label: w.name })) || []),
            ]}
            required
          />
          <Input
            label={t('budgets.month')}
            type="month"
            value={templateForm.month}
            onChange={(e) => setTemplateForm({ ...templateForm, month: e.target.value })}
            required
          />
          <Select
            label={t('common.template') || 'Template'}
            value={templateForm.template}
            onChange={(e) => setTemplateForm({ ...templateForm, template: e.target.value })}
            options={Object.entries(budgetTemplates).map(([key, v]) => ({ value: key, label: v.label }))}
          />
          <Input
            label={t('budgets.totalBudget') || 'Total Monthly Budget (base)'}
            type="number"
            step="0.01"
            value={templateForm.total_budget}
            onChange={(e) => setTemplateForm({ ...templateForm, total_budget: parseFloat(e.target.value) || 0 })}
          />
          <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-4">
            <Button variant="secondary" onClick={() => setIsTemplateModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={applyTemplate}>
              {t('common.apply') || 'Apply'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Budgets;
