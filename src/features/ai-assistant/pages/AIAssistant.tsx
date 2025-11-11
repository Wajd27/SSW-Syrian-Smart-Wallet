import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { entities } from '@/shared/api/entities';
import { aiApi } from '@/shared/api/ai';
import { useAuth } from '@/features/auth/context/AuthContext';
import Card from '@/shared/components/Card/Card';
import Button from '@/shared/components/Button/Button';
import Input from '@/shared/components/Forms/Input';
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';
import PullToRefresh from '@/shared/components/PullToRefresh/PullToRefresh';
import { useToast } from '@/shared/hooks/useToast';
import InfoTooltip from '@/shared/components/InfoTooltip/InfoTooltip';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { AIRecommendation } from '@/shared/types/entities';

function AIAssistant() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const suggestedQuestions = [
    'How can I reduce my monthly expenses?',
    'Which categories are causing overspending?',
    'What is my savings rate and how to improve it?',
    'Which debts should I pay first?',
    'How close am I to my savings goals?',
  ];

  useEffect(() => {
    if (user?.email) {
      const saved = localStorage.getItem(`ai-convo:${user.email}`);
      if (saved) setConversation(JSON.parse(saved));
    }
  }, [user?.email]);

  const persistConversation = (next: { role: 'user' | 'assistant'; content: string }[]) => {
    setConversation(next);
    if (user?.email) {
      localStorage.setItem(`ai-convo:${user.email}`, JSON.stringify(next));
    }
  };

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['ai-recommendations', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      // Gather context
      const wallets = await entities.wallet.filter({ owner_email: user.email, is_active: true });
      const walletIds = wallets.map((w) => w.id);

      const [savingsGoals, debts, investments, budgets, transactions] = await Promise.all([
        Promise.all(walletIds.map((id) => entities.savingsGoal.filter({ wallet_id: id }))).then(
          (results) => results.flat()
        ),
        entities.debt.filter({ wallet_owner: user.email }),
        entities.investment.filter({ wallet_owner: user.email }),
        Promise.all(walletIds.map((id) => entities.budget.filter({ wallet_id: id }))).then(
          (results) => results.flat()
        ),
        Promise.all(walletIds.map((id) => entities.transaction.filter({ wallet_id: id }))).then(
          (results) => results.flat()
        ),
      ]);

      const context = {
        savingsGoals,
        debts,
        investments,
        budgets,
        transactions,
      };

      const response = await aiApi.getRecommendations(context);
      return response.recommendations;
    },
    enabled: !!user?.email,
    refetchOnMount: true,
  });

  const { data: existingRecommendations } = useQuery({
    queryKey: ['ai-recommendations-entities', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return entities.aiRecommendation.filter({ wallet_owner: user.email });
    },
    enabled: !!user?.email,
  });

  const createRecommendationMutation = useMutation({
    mutationFn: entities.aiRecommendation.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations-entities'] });
      showSuccess(t('common.save') + ' ' + t('common.success'));
    },
    onError: (error: Error) => {
      showError(error.message || t('common.error'));
    },
  });

  const updateRecommendationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AIRecommendation> }) =>
      entities.aiRecommendation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations-entities'] });
      showSuccess(t('common.success'));
    },
    onError: (error: Error) => {
      showError(error.message || t('common.error'));
    },
  });

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      const wallets = await entities.wallet.filter({
        owner_email: user!.email,
        is_active: true,
      });
      const walletIds = wallets.map((w) => w.id);
      const transactions = await Promise.all(
        walletIds.map((id) => entities.transaction.filter({ wallet_id: id }))
      );

      const response = await aiApi.askQuestion(question, {
        transactions: transactions.flat(),
      });
      setAnswer(response);
      persistConversation([...conversation, { role: 'user', content: question }, { role: 'assistant', content: response }]);
      showSuccess(t('common.success'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.';
      setAnswer(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecommendation = async (rec: any) => {
    await createRecommendationMutation.mutateAsync({
      ...rec,
      wallet_owner: user!.email,
      is_implemented: false,
    });
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  return (
    <PullToRefresh queryKeys={['ai-recommendations', 'ai-recommendations-entities', 'wallets', 'transactions', 'savings-goals', 'debts', 'investments', 'budgets']}>
      <div className="space-y-6">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <h1 className="text-2xl font-bold text-gray-900">{t('aiAssistant.title')}</h1>
          <InfoTooltip content={t('aiAssistant.info')} />
        </div>

      {/* Question Input */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, idx) => (
              <Button key={idx} variant="secondary" size="sm" onClick={() => setQuestion(q)}>
                {q}
              </Button>
            ))}
          </div>
          <Input
            label={t('aiAssistant.askQuestion')}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask me anything about your finances..."
            onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
          />
          <Button onClick={handleAskQuestion} isLoading={loading}>
            <SparklesIcon className="w-5 h-5 ml-2 rtl:ml-0 rtl:mr-2" />
            Ask
          </Button>
          {answer && (
            <div className="mt-4 p-4 bg-primary-50 rounded-lg">
              <p className="text-gray-700">{answer}</p>
            </div>
          )}
          {conversation.length > 0 && (
            <div className="mt-4">
              <h3 className="text-md font-semibold text-gray-900 mb-2">Conversation</h3>
              <div className="space-y-2 max-h-64 overflow-auto">
                {conversation.map((m, i) => (
                  <div key={i} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-50 text-blue-900' : 'bg-gray-50 text-gray-800'}`}>
                    <span className="text-xs uppercase font-semibold mr-2 rtl:ml-2 rtl:mr-0">{m.role}</span>
                    <span>{m.content}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-2">
                <Button variant="outline" size="sm" onClick={() => persistConversation([])}>
                  {t('common.clear') || 'Clear'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Recommendations */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t('aiAssistant.recommendations')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations?.map((rec, index) => {
            const existing = existingRecommendations?.find(
              (r) => r.target_id === rec.target_id && r.type === rec.type
            );
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">{rec.description}</p>
                </div>
                <div className="flex items-center justify-between text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Impact: </span>
                    <span className="font-semibold capitalize">{rec.impact}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Effort: </span>
                    <span className="font-semibold capitalize">{rec.effort}</span>
                  </div>
                </div>
                {rec.estimated_savings && (
                  <p className="text-sm text-green-600 font-semibold mb-4">
                    Estimated Savings: {rec.estimated_savings.toLocaleString()} SYP
                  </p>
                )}
                {existing ? (
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Button
                      variant={existing.is_implemented ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() =>
                        updateRecommendationMutation.mutate({
                          id: existing.id,
                          data: { is_implemented: !existing.is_implemented },
                        })
                      }
                    >
                      {existing.is_implemented
                        ? t('aiAssistant.implemented')
                        : t('aiAssistant.notImplemented')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setQuestion(`How to implement: ${rec.title}?`)}
                    >
                      Ask follow-up
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSaveRecommendation(rec)}
                  >
                    {t('common.save')}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
        {recommendations?.length === 0 && (
          <Card>
            <p className="text-center text-gray-500 py-8">No recommendations at this time</p>
          </Card>
        )}
      </div>
      </div>
    </PullToRefresh>
  );
}

export default AIAssistant;
