import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { entities } from '@/shared/api/entities';
import Card from '@/shared/components/Card/Card';
import Button from '@/shared/components/Button/Button';
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';
import { UserIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { FamilyMember } from '@/shared/types/entities';

function FamilyMemberSelector() {
  const { t } = useTranslation();
  const { user, setSelectedFamilyMember } = useAuth();
  const navigate = useNavigate();
  const [rememberChoice, setRememberChoice] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | 'owner' | null>(null);

  const { data: familyMembers, isLoading } = useQuery({
    queryKey: ['family-members', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.familyMember.filter({ added_by: user.email, is_active: true });
    },
    enabled: !!user?.email,
  });

  // Fetch transaction counts for each member (optional, don't block if it fails)
  const { data: transactions } = useQuery({
    queryKey: ['transactions', 'summary', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const wallets = await entities.wallet.filter({ owner_email: user.email, is_active: true });
        if (!wallets || wallets.length === 0) return [];
        const walletIds = wallets.map((w) => w.id);
        const allTransactions = await Promise.all(
          walletIds.map((id) => entities.transaction.filter({ wallet_id: id }))
        );
        return allTransactions.flat();
      } catch (error) {
        console.error('Error fetching transactions for selector:', error);
        return [];
      }
    },
    enabled: !!user?.email,
    retry: 1,
  });

  const getMemberTransactionCount = (memberId: string) => {
    if (!transactions) return 0;
    return transactions.filter((t) => t.family_member_id === memberId).length;
  };

  const getLastActivity = (memberId: string) => {
    if (!transactions) return null;
    const memberTransactions = transactions
      .filter((t) => t.family_member_id === memberId)
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
    return memberTransactions.length > 0 ? memberTransactions[0].transaction_date : null;
  };

  const handleSelect = (member: FamilyMember | 'owner') => {
    setSelectedMember(member);
  };

  const handleContinue = () => {
    if (!selectedMember) return;

    if (selectedMember === 'owner') {
      setSelectedFamilyMember('owner', rememberChoice);
    } else {
      setSelectedFamilyMember(selectedMember, rememberChoice);
    }

    Promise.resolve().then(() => {
      navigate('/', { replace: true });
    });
  };

  const handleSkip = () => {
    setSelectedFamilyMember('owner', false);
    Promise.resolve().then(() => {
      navigate('/', { replace: true });
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-4xl w-full space-y-8 animate-scale-in">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-800 drop-shadow-sm mb-2">
            {t('auth.selectFamilyMember')}
          </h2>
          <p className="text-gray-600">{t('auth.selectFamilyMemberDescription')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Owner Card */}
          <div
            className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
              selectedMember === 'owner'
                ? 'ring-4 ring-primary-500 bg-chip-bg'
                : 'hover:bg-gray-50/50'
            }`}
            onClick={() => handleSelect('owner')}
          >
            <Card>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-chip-bg border border-chip-border flex items-center justify-center">
                  <UserIcon className="w-10 h-10 text-primary-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {user?.full_name || user?.email}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{t('auth.accountOwner')}</p>
                </div>
                {selectedMember === 'owner' && (
                  <div className="flex items-center text-primary-600 font-medium">
                    <span>{t('common.selected')}</span>
                    <ArrowRightIcon className="w-5 h-5 ml-2 rtl:ml-0 rtl:mr-2" />
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Family Member Cards */}
          {familyMembers?.map((member) => {
            const transactionCount = getMemberTransactionCount(member.id);
            const lastActivity = getLastActivity(member.id);
            const isSelected = selectedMember === member;

            return (
              <div
                key={member.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                  isSelected
                    ? 'ring-4 ring-primary-500 bg-chip-bg'
                    : 'hover:bg-gray-50/50'
                }`}
                onClick={() => handleSelect(member)}
              >
                <Card>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-green-600">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{member.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{member.relationship}</p>
                      {transactionCount > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          {transactionCount} {t('family.transactionCount').toLowerCase()}
                        </p>
                      )}
                      {lastActivity && (
                        <p className="text-xs text-gray-400 mt-1">
                          {t('family.lastActivity')}: {new Date(lastActivity).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="flex items-center text-primary-600 font-medium">
                        <span>{t('common.selected')}</span>
                        <ArrowRightIcon className="w-5 h-5 ml-2 rtl:ml-0 rtl:mr-2" />
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Remember Choice Checkbox */}
        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
          <input
            type="checkbox"
            id="remember"
            checked={rememberChoice}
            onChange={(e) => setRememberChoice(e.target.checked)}
            className="w-4 h-4 text-primary-600 border-app-border rounded focus:ring-primary-500/40"
          />
          <label htmlFor="remember" className="text-sm text-gray-700 cursor-pointer">
            {t('auth.rememberChoice')}
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4 rtl:space-x-reverse">
          <Button variant="secondary" onClick={handleSkip}>
            {t('auth.skipSelection')}
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!selectedMember}
            className="min-w-[150px]"
          >
            {t('common.continue')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default FamilyMemberSelector;

