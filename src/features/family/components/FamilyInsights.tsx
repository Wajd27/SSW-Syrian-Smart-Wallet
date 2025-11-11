import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/shared/api/entities';
import { useAuth } from '@/features/auth/context/AuthContext';
import Card from '@/shared/components/Card/Card';
import { LightBulbIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { FamilyMember, Transaction } from '@/shared/types/entities';
import { calculateMemberSpending } from '../utils/familyAnalytics';

interface FamilyInsightsProps {
  members: FamilyMember[];
  transactions: Transaction[];
}

function FamilyInsights({ members, transactions }: FamilyInsightsProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const insights = useMemo(() => {
    if (!members || !transactions || members.length === 0) return [];

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const memberStats = new Map();
    members.forEach((member) => {
      if (member.is_active) {
        memberStats.set(member.id, calculateMemberSpending(member, transactions));
      }
    });

    const insightsList: Array<{ type: 'pattern' | 'recommendation' | 'milestone'; message: string; memberId?: string }> = [];

    // Spending pattern detection
    members.forEach((member) => {
      if (!member.is_active) return;
      const stats = memberStats.get(member.id);
      if (!stats || stats.transactionCount === 0) return;

      // Pattern: Most spending on category
      if (stats.favoriteCategory) {
        insightsList.push({
          type: 'pattern',
          message: t('family.insightPattern', { name: member.name, category: stats.favoriteCategory }),
          memberId: member.id,
        });
      }

      // Recommendation: Set budget for high spending
      if (stats.totalSpentThisMonth > 0 && !member.spending_limit) {
        insightsList.push({
          type: 'recommendation',
          message: t('family.insightRecommendation', { name: member.name }),
          memberId: member.id,
        });
      }

      // Milestone: High spending
      if (stats.totalSpentThisMonth > stats.averageTransaction * 5) {
        insightsList.push({
          type: 'milestone',
          message: t('family.insightMilestone', { name: member.name }),
          memberId: member.id,
        });
      }
    });

    // Comparison insights
    const allSpending = Array.from(memberStats.values()).map((s) => s.totalSpentThisMonth);
    const avgSpending = allSpending.reduce((sum, s) => sum + s, 0) / (allSpending.length || 1);

    members.forEach((member) => {
      if (!member.is_active) return;
      const stats = memberStats.get(member.id);
      if (!stats) return;

      if (stats.totalSpentThisMonth > avgSpending * 1.2 && avgSpending > 0) {
        const percentage = ((stats.totalSpentThisMonth - avgSpending) / avgSpending) * 100;
        insightsList.push({
          type: 'pattern',
          message: t('family.insightComparison', { name: member.name, percentage: percentage.toFixed(0) }),
          memberId: member.id,
        });
      }
    });

    return insightsList.slice(0, 6); // Limit to 6 insights
  }, [members, transactions, t]);

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card title={t('family.insights')}>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 rtl:space-x-reverse p-3 rounded-lg ${
              insight.type === 'recommendation'
                ? 'bg-yellow-50 border border-yellow-200'
                : insight.type === 'milestone'
                ? 'bg-green-50 border border-green-200'
                : 'bg-blue-50 border border-blue-200'
            }`}
          >
            {insight.type === 'recommendation' ? (
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            ) : (
              <LightBulbIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm text-gray-700 flex-1">{insight.message}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default FamilyInsights;

