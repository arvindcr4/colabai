export enum ModelType {
  GPT4O = 'gpt-4o',
  GPT4O_MINI = 'gpt-4o-mini',
  DEEPSEEK_CHAT = 'deepseek-chat'
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceUSD: number;
  paypalPlanId: string; // PayPal plan ID
  features: string[];
  limits: {
    messagesPerDay: number;
    availableModels: ModelType[];
    contextWindow: number;
    maxOutputSize: number;
    errorAnalysis: boolean;
    outputAnalysis: boolean;
  };
  popular?: boolean;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    priceUSD: 0,
    description: 'Basic AI assistance for your notebooks',
    features: [
      'DeepSeek Chat for code assistance',
      '10 messages',
      'Manage your notebook (add, delete, edit cells)',
      'Limited context window (7,000 tokens)'
    ],
    limits: {
      messagesPerDay: 10,
      contextWindow: 7000,
      maxOutputSize: 500,
      errorAnalysis: false,
      outputAnalysis: false,
      availableModels: [ModelType.DEEPSEEK_CHAT, ModelType.GPT4O_MINI]
    },
    popular: false,
    paypalPlanId: 'P-XXXXXXXXXXXX'
  },
  {
    id: 'basic',
    name: 'Basic',
    priceUSD: 4.99,
    popular: true,
    description: 'Enhanced experience with advanced features',
    features: [
      'DeepSeek Chat with larger context',
      '50 messages per day',
      'Manage your notebook (add, delete, edit cells)',
      'Extended context window (70,000 tokens)',
    ],
    limits: {
      messagesPerDay: 50,
      contextWindow: 70000,
      maxOutputSize: 1000,
      errorAnalysis: true,
      outputAnalysis: true,
      availableModels: [ModelType.DEEPSEEK_CHAT, ModelType.GPT4O_MINI]
    },
    paypalPlanId: 'P-96764306DU999431NM5GB4XI'
  },
  {
    id: 'pro',
    name: 'Pro',
    priceUSD: 14.99,
    description: 'Full-featured AI pair programming experience',
    features: [
      'Full GPT-4O access',
      '200 messages per day',
      'Advanced error analysis & fixes',
      'Real-time output analysis',
      'Maximum context window (100,000 tokens)',
      'Early access to new features'
    ],
    limits: {
      messagesPerDay: 200,
      contextWindow: 100000,
      maxOutputSize: 2000,
      errorAnalysis: true,
      outputAnalysis: true,
      availableModels: [ModelType.DEEPSEEK_CHAT, ModelType.GPT4O_MINI, ModelType.GPT4O]
    },
    popular: false,
    paypalPlanId: 'P-150966115D107033GM5GB57I'
  }
];


export const sandboxSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    priceUSD: 0,
    description: 'Basic AI assistance for your notebooks',
    features: [
      'DeepSeek Chat for code assistance',
      '10 messages',
      'Manage your notebook (add, delete, edit cells)',
      'Limited context window (7,000 tokens)'
    ],
    limits: {
      messagesPerDay: 10,
      contextWindow: 7000,
      maxOutputSize: 500,
      errorAnalysis: false,
      outputAnalysis: false,
      availableModels: [ModelType.DEEPSEEK_CHAT, ModelType.GPT4O_MINI]
    },
    popular: false,
    paypalPlanId: 'P-XXXXXXXXXXXX'
  },
  {
    id: 'basic',
    name: 'Basic',
    priceUSD: 4.99,
    popular: true,
    description: 'Enhanced experience with advanced features',
    features: [
      'DeepSeek Chat with larger context',
      '50 messages per day',
      'Manage your notebook (add, delete, edit cells)',
      'Extended context window (70,000 tokens)',
    ],
    limits: {
      messagesPerDay: 50,
      contextWindow: 70000,
      maxOutputSize: 1000,
      errorAnalysis: true,
      outputAnalysis: true,
      availableModels: [ModelType.DEEPSEEK_CHAT, ModelType.GPT4O_MINI]
    },
    paypalPlanId: 'P-7U179980KW241064YM5GDVHI'
  },
  {
    id: 'pro',
    name: 'Pro',
    priceUSD: 14.99,
    description: 'Full-featured AI pair programming experience',
    features: [
      'Full GPT-4O access',
      '200 messages per day',
      'Advanced error analysis & fixes',
      'Real-time output analysis',
      'Maximum context window (100,000 tokens)',
      'Early access to new features'
    ],
    limits: {
      messagesPerDay: 200,
      contextWindow: 100000,
      maxOutputSize: 2000,
      errorAnalysis: true,
      outputAnalysis: true,
      availableModels: [ModelType.DEEPSEEK_CHAT, ModelType.GPT4O_MINI, ModelType.GPT4O]
    },
    popular: false,
    paypalPlanId: 'P-3UL32658LC846960TM5GDVSI'
  }
];