import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { entities } from '@/shared/api/entities';
import { aiApi } from '@/shared/api/ai';
import { useAuth } from '@/features/auth/context/AuthContext';
import Card from '@/shared/components/Card/Card';
import Button from '@/shared/components/Button/Button';
import Input from '@/shared/components/Forms/Input';
import LoadingSpinner from '@/shared/components/Loading/LoadingSpinner';
import { useToast } from '@/shared/hooks/useToast';
import InfoTooltip from '@/shared/components/InfoTooltip/InfoTooltip';
import { SparklesIcon, PaperAirplaneIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { AIRecommendation } from '@/shared/types/entities';

function AIAssistant() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant'; content: string; timestamp: Date }[]>([]);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const suggestedQuestions = [
    t('aiAssistant.suggestedQuestions.reduceExpenses'),
    t('aiAssistant.suggestedQuestions.overspendingCategories'),
    t('aiAssistant.suggestedQuestions.savingsRate'),
    t('aiAssistant.suggestedQuestions.debtPriority'),
    t('aiAssistant.suggestedQuestions.savingsGoals'),
  ];
  
  const visibleQuestions = showAllQuestions ? suggestedQuestions : suggestedQuestions.slice(0, 2);

  useEffect(() => {
    if (user?.email) {
      const saved = localStorage.getItem(`ai-convo:${user.email}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert timestamps back to Date objects
        const withDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        }));
        setConversation(withDates);
      }
    }
  }, [user?.email]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const persistConversation = (next: { role: 'user' | 'assistant'; content: string; timestamp: Date }[]) => {
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

      const [savingsGoals, debts, investments, budgets, transactions, existingRecommendations] = await Promise.all([
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
        entities.aiRecommendation.filter({ wallet_owner: user.email }),
      ]);

      const context = {
        savingsGoals,
        debts,
        investments,
        budgets,
        transactions,
        wallets,
        existingRecommendations,
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

  const handleAskQuestion = async (questionText?: string) => {
    const questionToAsk = questionText || question;
    if (!questionToAsk.trim()) return;

    const userMessage = { role: 'user' as const, content: questionToAsk, timestamp: new Date() };
    const updatedConversation = [...conversation, userMessage];
    setConversation(updatedConversation);
    setQuestion('');
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

      const response = await aiApi.askQuestion(questionToAsk, {
        transactions: transactions.flat(),
      });
      
      const assistantMessage = { role: 'assistant' as const, content: response, timestamp: new Date() };
      persistConversation([...updatedConversation, assistantMessage]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('aiAssistant.errorMessage');
      const errorMsg = { role: 'assistant' as const, content: errorMessage, timestamp: new Date() };
      persistConversation([...updatedConversation, errorMsg]);
      showError(errorMessage);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
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
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shrink-0">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('aiAssistant.title')}</h1>
            <p className="text-xs text-gray-500 hidden sm:block">{t('aiAssistant.subtitle')}</p>
          </div>
        </div>
        <InfoTooltip content={t('aiAssistant.info')} />
      </div>

      {/* Chat Section */}
      <div className="flex flex-col h-[calc(100vh-12rem)] sm:h-[calc(100vh-10rem)] max-h-[600px] min-h-[400px]">
        {/* Chat Container */}
        <div className="flex-1 flex flex-col min-h-0">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg mb-4">
          {conversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-4">
                <SparklesIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('aiAssistant.welcomeTitle')}</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md">{t('aiAssistant.welcomeMessage')}</p>
              
              {/* Suggested Questions */}
              <div className="w-full max-w-2xl space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">{t('aiAssistant.suggestedQuestionsTitle')}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {visibleQuestions.map((q, idx) => (
                    <Button
                      key={idx}
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAskQuestion(q)}
                      className="text-left rtl:text-right"
                    >
                      {q}
                    </Button>
                  ))}
                </div>
                {suggestedQuestions.length > 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllQuestions(!showAllQuestions)}
                    className="mt-2"
                  >
                    {showAllQuestions ? (
                      <>
                        <ChevronUpIcon className="w-4 h-4 ml-1 rtl:mr-1 rtl:ml-0" />
                        {t('aiAssistant.showLess')}
                      </>
                    ) : (
                      <>
                        <ChevronDownIcon className="w-4 h-4 ml-1 rtl:mr-1 rtl:ml-0" />
                        {t('aiAssistant.showMore')}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {conversation.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                      m.role === 'user'
                        ? 'bg-primary-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                    <p className={`text-xs mt-1 ${m.role === 'user' ? 'text-primary-100' : 'text-gray-400'}`}>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex space-x-1 rtl:space-x-reverse">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="bg-white border-t border-gray-200 p-4 rounded-lg">
          <div className="flex items-end space-x-2 rtl:space-x-reverse">
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t('aiAssistant.placeholder')}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAskQuestion();
                  }
                }}
                className="input w-full text-gray-900 placeholder:text-gray-500"
                disabled={loading}
              />
            </div>
            <Button
              onClick={() => handleAskQuestion()}
              isLoading={loading}
              disabled={!question.trim() || loading}
              className="shrink-0"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </Button>
            {conversation.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  persistConversation([]);
                  setQuestion('');
                }}
                className="shrink-0"
              >
                {t('common.clear')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="mt-6">
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
                    <span className="text-gray-500">{t('aiAssistant.impact')}: </span>
                    <span className="font-semibold capitalize">{rec.impact}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('aiAssistant.effort')}: </span>
                    <span className="font-semibold capitalize">{rec.effort}</span>
                  </div>
                </div>
                {rec.estimated_savings && (
                  <p className="text-sm text-green-600 font-semibold mb-4">
                    {t('aiAssistant.estimatedSavings')}: {rec.estimated_savings.toLocaleString()} SYP
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
                      onClick={() => setQuestion(t('aiAssistant.howToImplement', { title: rec.title }))}
                    >
                      {t('aiAssistant.askFollowUp')}
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
            <p className="text-center text-gray-500 py-8">{t('aiAssistant.noRecommendations')}</p>
          </Card>
        )}
      </div>
    </div>
  );
}

export default AIAssistant;
