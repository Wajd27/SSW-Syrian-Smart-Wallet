import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { entities } from '@/shared/api/entities';
import { useAuth } from '@/features/auth/context/AuthContext';
import Card from '@/shared/components/Card/Card';
import Button from '@/shared/components/Button/Button';
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { useMemo } from 'react';

function FamilySpendingWidget() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: familyMembers, isLoading: membersLoading } = useQuery({
    queryKey: ['family-members', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.familyMember.filter({ added_by: user.email, is_active: true });
    },
    enabled: !!user?.email,
    refetchOnMount: true,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', 'family-widget', user?.email],
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
    refetchOnMount: true,
  });

  const topSpenders = useMemo(() => {
    if (!familyMembers || !transactions) return [];
    
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const memberSpending = familyMembers.map((member) => {
      const memberTransactions = transactions.filter(
        (t) =>
          t.family_member_id === member.id &&
          t.type === 'expense' &&
          t.transaction_date.startsWith(currentMonth)
      );
      
      const total = memberTransactions.reduce((sum, t) => {
        return sum + (t.primary_currency === 'USD' ? t.amount_usd : t.amount_syp);
      }, 0);
      
      return {
        member,
        total,
        transactionCount: memberTransactions.length,
      };
    });
    
    return memberSpending
      .filter((m) => m.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [familyMembers, transactions]);

  if (membersLoading || transactionsLoading) {
    return (
      <Card title={t('family.spendingDistribution')}>
        <LoadingSpinner size="sm" className="h-32" />
      </Card>
    );
  }

  if (!familyMembers || familyMembers.length === 0) {
    return null;
  }

  return (
    <Card
      title={t('family.spendingDistribution')}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/family')}
        >
          {t('common.viewAll')}
        </Button>
      }
    >
      {topSpenders.length > 0 ? (
        <div className="space-y-3">
          {topSpenders.map(({ member, total, transactionCount }, index) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-800">{member.name}</div>
                  <div className="text-xs text-gray-500">
                    {transactionCount} {t('family.transactionCount').toLowerCase()}
                  </div>
                </div>
              </div>
              <div className="text-right rtl:text-left">
                <div className="font-semibold text-gray-800">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: user?.default_currency || 'SYP',
                    minimumFractionDigits: 0,
                  }).format(total)}
                </div>
                <div className="text-xs text-gray-500">#{index + 1}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <UserGroupIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>{t('family.noSpendingThisMonth')}</p>
        </div>
      )}
    </Card>
  );
}

export default FamilySpendingWidget;

