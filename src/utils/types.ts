export { subscriptionPlans, type SubscriptionPlan, type ModelType } from '../../supabase/functions/_shared/subscription-plans'; 

export interface SubscriptionDetails {
  id: string;
  profile_id: string;
  paypal_subscription_id: string;
  plan_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: any;
  session: any;
  subscriptionPlan: string;
  subscriptionDetails: SubscriptionDetails | null;
}

export type NotebookCell = {
  id: string;
  type: 'code' | 'markdown';
  content: string;
  index: number;
}