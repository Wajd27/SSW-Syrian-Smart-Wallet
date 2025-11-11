// AI Assistant API - Using free LLM API
// For production, use OpenAI API or Hugging Face Inference API

export interface AIRecommendationResponse {
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    estimated_savings?: number;
    target_id?: string;
  }>;
}

export const aiApi = {
  async getRecommendations(context: {
    savingsGoals?: any[];
    debts?: any[];
    investments?: any[];
    budgets?: any[];
    transactions?: any[];
    wallets?: any[];
    existingRecommendations?: any[];
  }): Promise<AIRecommendationResponse> {
    // In a real implementation, this would call an LLM API
    // For now, return mock recommendations based on context
    const recommendations: AIRecommendationResponse['recommendations'] = [];
    
    // Create a map of existing recommendations to avoid duplicates
    const existingMap = new Map<string, boolean>();
    if (context.existingRecommendations) {
      context.existingRecommendations.forEach((rec) => {
        const key = `${rec.type}_${rec.target_id}`;
        existingMap.set(key, true);
      });
    }
    
    // Create a wallet map for currency lookup
    const walletMap = new Map<string, any>();
    if (context.wallets) {
      context.wallets.forEach((wallet) => {
        walletMap.set(wallet.id, wallet);
      });
    }

    // Analyze savings goals
    if (context.savingsGoals) {
      context.savingsGoals.forEach((goal) => {
        // Check if recommendation already exists
        const key = `savings_goal_${goal.id}`;
        if (existingMap.has(key)) {
          return; // Skip if already exists
        }
        
        const progress = (goal.current_amount / goal.target_amount) * 100;
        if (progress < 50) {
          // Get currency from wallet
          const wallet = walletMap.get(goal.wallet_id);
          const currency = wallet?.currency || 'SYP';
          
          recommendations.push({
            type: 'savings_goal',
            title: `Increase savings for ${goal.title}`,
            description: `You're ${(100 - progress).toFixed(0)}% away from your ${currency} ${goal.target_amount.toLocaleString()} goal. Consider increasing monthly contributions.`,
            impact: 'high',
            effort: 'medium',
            estimated_savings: goal.target_amount * 0.1,
            target_id: goal.id,
          });
        }
      });
    }

    // Analyze debts
    if (context.debts) {
      context.debts.forEach((debt) => {
        // Check if recommendation already exists
        const key = `debt_${debt.id}`;
        if (existingMap.has(key)) {
          return; // Skip if already exists
        }
        
        if (debt.interest_rate > 5) {
          const currency = debt.currency || 'SYP';
          recommendations.push({
            type: 'debt',
            title: `Pay off high-interest debt: ${debt.name}`,
            description: `This debt has a ${debt.interest_rate}% interest rate with a balance of ${currency} ${debt.current_balance.toLocaleString()}. Consider prioritizing payments.`,
            impact: 'high',
            effort: 'medium',
            estimated_savings: debt.current_balance * (debt.interest_rate / 100),
            target_id: debt.id,
          });
        }
      });
    }

    // Analyze budgets
    if (context.budgets && context.budgets.length > 0) {
      // This would require transaction data to calculate actual spending
      // For now, just a placeholder
    }

    return { recommendations };
  },

  async askQuestion(question: string, _context: any): Promise<string> {
    // In a real implementation, this would call an LLM API
    // For now, return a mock response
    return `Based on your financial data, I recommend focusing on your savings goals and paying off high-interest debts first. ${question}`;
  },
};

