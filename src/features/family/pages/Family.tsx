import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
import PieChart from '@/shared/components/Charts/PieChart';
import LineChart from '@/shared/components/Charts/LineChart';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CakeIcon,
} from '@heroicons/react/24/outline';
import { FamilyMember } from '@/shared/types/entities';
import {
  calculateAge,
  getDaysUntilBirthday,
  calculateMemberSpending,
  formatCurrency,
} from '../utils/familyAnalytics';
import FamilyInsights from '../components/FamilyInsights';

function Family() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<FamilyMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    date_of_birth: '',
    spending_limit: '',
    spending_limit_currency: user?.default_currency || 'SYP',
  });

  const { data: members, isLoading } = useQuery({
    queryKey: ['family-members', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.familyMember.filter({ added_by: user.email });
    },
    enabled: !!user?.email,
  });

  // Fetch all transactions for analytics
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', 'family-analytics', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const wallets = await entities.wallet.filter({ owner_email: user.email, is_active: true });
      if (!wallets || wallets.length === 0) return [];
      const walletIds = wallets.map((w) => w.id);
      const allTransactions = await Promise.all(
        walletIds.map((id) => entities.transaction.filter({ wallet_id: id }))
      );
      return allTransactions.flat();
    },
    enabled: !!user?.email,
  });

  // Calculate spending stats for each member
  const memberStats = useMemo(() => {
    if (!members || !transactions) return new Map();
    const statsMap = new Map();
    members.forEach((member) => {
      if (member.is_active) {
        statsMap.set(member.id, calculateMemberSpending(member, transactions, user?.last_exchange_rate));
      }
    });
    return statsMap;
  }, [members, transactions, user?.last_exchange_rate]);

  const createMutation = useMutation({
    mutationFn: entities.familyMember.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      setIsModalOpen(false);
      resetForm();
      showSuccess(t('family.addMember') + ' ' + t('common.success'));
    },
    onError: (error: Error) => {
      showError(error.message || t('common.error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FamilyMember> }) =>
      entities.familyMember.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      setIsModalOpen(false);
      setEditingMember(null);
      resetForm();
      showSuccess(t('family.editMember') + ' ' + t('common.success'));
    },
    onError: (error: Error) => {
      showError(error.message || t('common.error'));
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      entities.familyMember.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      showSuccess(t('common.success'));
    },
    onError: (error: Error) => {
      showError(error.message || t('common.error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => entities.familyMember.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
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
      name: '',
      relationship: '',
      date_of_birth: '',
      spending_limit: '',
      spending_limit_currency: user?.default_currency || 'SYP',
    });
  };

  const handleOpenModal = (member?: FamilyMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        relationship: member.relationship,
        date_of_birth: member.date_of_birth || '',
        spending_limit: member.spending_limit?.toString() || '',
        spending_limit_currency: member.spending_limit_currency || user?.default_currency || 'SYP',
      });
    } else {
      setEditingMember(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      updateMutation.mutate({
        id: editingMember.id,
        data: {
          ...formData,
          date_of_birth: formData.date_of_birth || undefined,
          spending_limit: formData.spending_limit ? parseFloat(formData.spending_limit) : undefined,
          spending_limit_currency: formData.spending_limit_currency,
        },
      });
    } else {
      createMutation.mutate({
        ...formData,
        added_by: user!.email,
        is_active: true,
        date_of_birth: formData.date_of_birth || undefined,
        spending_limit: formData.spending_limit ? parseFloat(formData.spending_limit) : undefined,
        spending_limit_currency: formData.spending_limit_currency,
      });
    }
  };

  if (isLoading || transactionsLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  const relationships = [
    'Spouse',
    'Child',
    'Parent',
    'Sibling',
    'Other',
  ];

  const activeMembers = members?.filter((m) => m.is_active) || [];

  // Find top spender
  const topSpender = useMemo(() => {
    if (!activeMembers.length || !transactions) return null;
    let maxSpending = 0;
    let topMember: FamilyMember | null = null;
    activeMembers.forEach((member) => {
      const stats = memberStats.get(member.id);
      if (stats && stats.totalSpentThisMonth > maxSpending) {
        maxSpending = stats.totalSpentThisMonth;
        topMember = member;
      }
    });
    return topMember;
  }, [activeMembers, memberStats]);

  // Find most active (most transactions)
  const mostActive = useMemo(() => {
    if (!activeMembers.length || !transactions) return null;
    let maxTransactions = 0;
    let activeMember: FamilyMember | null = null;
    activeMembers.forEach((member) => {
      const stats = memberStats.get(member.id);
      if (stats && stats.transactionCount > maxTransactions) {
        maxTransactions = stats.transactionCount;
        activeMember = member;
      }
    });
    return activeMember;
  }, [activeMembers, memberStats]);

  return (
    <PullToRefresh queryKeys={['family-members', 'transactions']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <h1 className="text-2xl font-bold text-gray-800">{t('family.title')}</h1>
            <InfoTooltip content={t('family.info')} />
          </div>
          <Button onClick={() => handleOpenModal()}>
            <PlusIcon className="w-5 h-5 ml-2 rtl:ml-0 rtl:mr-2" />
            {t('family.addMember')}
          </Button>
        </div>

        {/* Family Insights */}
        {activeMembers.length > 0 && transactions && (
          <FamilyInsights members={activeMembers} transactions={transactions} />
        )}

        {/* Summary Stats */}
        {activeMembers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="text-sm text-gray-500 mb-1">{t('family.topSpender')}</div>
              <div className="text-lg font-semibold text-gray-800">
                {topSpender?.name || '-'}
              </div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500 mb-1">{t('family.mostActive')}</div>
              <div className="text-lg font-semibold text-gray-800">
                {mostActive?.name || '-'}
              </div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500 mb-1">{t('family.totalMembers')}</div>
              <div className="text-lg font-semibold text-gray-800">{activeMembers.length}</div>
            </Card>
          </div>
        )}

        {/* Enhanced Member Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeMembers.map((member) => {
            const stats = memberStats.get(member.id);
            const age = calculateAge(member.date_of_birth);
            const daysUntilBirthday = getDaysUntilBirthday(member.date_of_birth);
            const spendingTrend = stats
              ? stats.monthlySpending.length >= 2
                ? stats.monthlySpending[stats.monthlySpending.length - 1].amount -
                  stats.monthlySpending[stats.monthlySpending.length - 2].amount
                : 0
              : 0;

            return (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{member.name}</h3>
                      <p className="text-sm text-gray-500">{member.relationship}</p>
                    </div>
                    {daysUntilBirthday !== null && daysUntilBirthday <= 30 && (
                      <div className="flex items-center space-x-1 rtl:space-x-reverse text-orange-600 bg-orange-50 px-2 py-1 rounded-full text-xs">
                        <CakeIcon className="w-4 h-4" />
                        <span>{t('family.birthdayIn', { days: daysUntilBirthday })}</span>
                      </div>
                    )}
                  </div>

                  {/* Age */}
                  {age !== null && (
                    <p className="text-xs text-gray-400 mb-2">
                      {t('family.age')}: {age} {t('common.years')}
                    </p>
                  )}

                  {/* Spending Stats */}
                  {stats && (
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{t('family.monthlySpending')}</span>
                        <span className="text-sm font-semibold text-gray-800">
                          {formatCurrency(stats.totalSpentThisMonth, user?.default_currency || 'SYP')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{t('family.transactionCount')}</span>
                        <span className="text-sm font-semibold text-gray-800">
                          {stats.transactionCount}
                        </span>
                      </div>
                      {stats.favoriteCategory && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">{t('family.favoriteCategory')}</span>
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {stats.favoriteCategory}
                          </span>
                        </div>
                      )}
                      {spendingTrend !== 0 && (
                        <div className="flex items-center space-x-1 rtl:space-x-reverse">
                          <span className="text-xs text-gray-500">{t('family.spendingTrend')}:</span>
                          {spendingTrend > 0 ? (
                            <ArrowUpIcon className="w-4 h-4 text-red-500" />
                          ) : (
                            <ArrowDownIcon className="w-4 h-4 text-green-500" />
                          )}
                          <span
                            className={`text-xs font-medium ${
                              spendingTrend > 0 ? 'text-red-500' : 'text-green-500'
                            }`}
                          >
                            {formatCurrency(Math.abs(spendingTrend), user?.default_currency || 'SYP')}
                          </span>
                        </div>
                      )}
                      
                      {/* Spending Limit Progress */}
                      {member.spending_limit && stats && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-500">{t('family.spendingLimit')}</span>
                            <span className="text-xs font-medium text-gray-700">
                              {formatCurrency(stats.totalSpentThisMonth, member.spending_limit_currency || user?.default_currency || 'SYP')} / {formatCurrency(member.spending_limit, member.spending_limit_currency || user?.default_currency || 'SYP')}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                (stats.totalSpentThisMonth / member.spending_limit) * 100 >= 100
                                  ? 'bg-red-500'
                                  : (stats.totalSpentThisMonth / member.spending_limit) * 100 >= 80
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{
                                width: `${Math.min((stats.totalSpentThisMonth / member.spending_limit) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          {(stats.totalSpentThisMonth / member.spending_limit) * 100 >= 100 && (
                            <p className="text-xs text-red-600 mt-1 font-medium">
                              ⚠️ {t('family.limitExceeded')}
                            </p>
                          )}
                          {(stats.totalSpentThisMonth / member.spending_limit) * 100 >= 80 &&
                            (stats.totalSpentThisMonth / member.spending_limit) * 100 < 100 && (
                              <p className="text-xs text-yellow-600 mt-1 font-medium">
                              ⚠️ {t('family.limitApproaching')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Top Categories */}
                  {stats && stats.topCategories.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">{t('family.topCategories')}</p>
                      <div className="flex flex-wrap gap-1">
                        {stats.topCategories.map((cat, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                          >
                            {cat.category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 rtl:space-x-reverse flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal(member)}
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(member.id, member.name)}
                    isLoading={deleteMutation.isPending}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                  {stats && stats.transactionCount > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        navigate(`/transactions?family_member_id=${member.id}`);
                      }}
                    >
                      {t('family.viewTransactions')}
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedMemberForDetail(member)}
                  >
                    {t('common.viewDetails')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

      {members?.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 py-8">{t('common.noData')}</p>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMember(null);
          resetForm();
        }}
        title={editingMember ? t('family.editMember') : t('family.addMember')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('family.memberName')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Select
            label={t('family.relationship')}
            value={formData.relationship}
            onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
            options={[
              { value: '', label: t('common.select') },
              ...relationships.map((rel) => ({ value: rel, label: rel })),
            ]}
            required
          />
          <DatePicker
            label={t('family.dateOfBirth')}
            value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('family.spendingLimit')}
              type="number"
              step="0.01"
              value={formData.spending_limit}
              onChange={(e) => setFormData({ ...formData, spending_limit: e.target.value })}
              placeholder={t('common.optional') || 'Optional'}
            />
            <Select
              label={t('common.currency')}
              value={formData.spending_limit_currency}
              onChange={(e) => setFormData({ ...formData, spending_limit_currency: e.target.value })}
              options={[
                { value: 'SYP', label: 'SYP' },
                { value: 'USD', label: 'USD' },
              ]}
            />
          </div>
          <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingMember(null);
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

      {/* Member Detail Modal with Analytics */}
      {selectedMemberForDetail && (
        <Modal
          isOpen={!!selectedMemberForDetail}
          onClose={() => setSelectedMemberForDetail(null)}
          title={`${selectedMemberForDetail.name} - ${t('family.spendingSummary')}`}
          size="lg"
        >
          {(() => {
            const stats = memberStats.get(selectedMemberForDetail.id);
            const age = calculateAge(selectedMemberForDetail.date_of_birth);
            
            if (!stats) {
              return (
                <div className="text-center py-8 text-gray-500">
                  {t('common.noData')}
                </div>
              );
            }

            return (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <div className="text-xs text-gray-500 mb-1">{t('family.monthlySpending')}</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {formatCurrency(stats.totalSpentThisMonth, user?.default_currency || 'SYP')}
                    </div>
                  </Card>
                  <Card>
                    <div className="text-xs text-gray-500 mb-1">{t('family.lifetimeSpending')}</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {formatCurrency(stats.lifetimeSpending, user?.default_currency || 'SYP')}
                    </div>
                  </Card>
                  <Card>
                    <div className="text-xs text-gray-500 mb-1">{t('family.transactionCount')}</div>
                    <div className="text-lg font-semibold text-gray-800">{stats.transactionCount}</div>
                  </Card>
                  <Card>
                    <div className="text-xs text-gray-500 mb-1">{t('family.age')}</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {age !== null ? `${age} ${t('common.years')}` : '-'}
                    </div>
                  </Card>
                </div>

                {/* Category Breakdown Chart */}
                {stats.categoryBreakdown.length > 0 && (
                  <Card title={t('family.spendingDistribution')}>
                    <PieChart
                      data={stats.categoryBreakdown.slice(0, 6)}
                      height={250}
                    />
                  </Card>
                )}

                {/* Monthly Spending Trend */}
                {stats.monthlySpending.length > 0 && (
                  <Card title={t('family.spendingTrend')}>
                    <LineChart
                      data={stats.monthlySpending}
                      dataKeys={['amount']}
                      xAxisKey="month"
                      height={250}
                    />
                  </Card>
                )}

                {/* Quick Stats */}
                <div className="space-y-2">
                  {stats.favoriteCategory && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">{t('family.favoriteCategory')}</span>
                      <span className="text-sm font-medium text-gray-800">{stats.favoriteCategory}</span>
                    </div>
                  )}
                  {stats.averageTransaction > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">{t('family.averageTransaction')}</span>
                      <span className="text-sm font-medium text-gray-800">
                        {formatCurrency(stats.averageTransaction, user?.default_currency || 'SYP')}
                      </span>
                    </div>
                  )}
                  {stats.lastTransactionDate && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">{t('family.lastTransaction')}</span>
                      <span className="text-sm font-medium text-gray-800">
                        {new Date(stats.lastTransactionDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigate(`/transactions?family_member_id=${selectedMemberForDetail.id}`);
                      setSelectedMemberForDetail(null);
                    }}
                  >
                    {t('family.viewTransactions')}
                  </Button>
                  <Button onClick={() => setSelectedMemberForDetail(null)}>
                    {t('common.close')}
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
      </div>
    </PullToRefresh>
  );
}

export default Family;
