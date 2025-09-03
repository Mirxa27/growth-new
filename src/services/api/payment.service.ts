/**
 * Payment Service
 * Handles all payment and subscription-related operations
 */

import { BaseApiService, type ApiResponse } from './base.service';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { z } from 'zod';
import { CreatePaymentSchema, UpdateSubscriptionSchema } from '@/services/validation/payment.schemas';

export type SubscriptionPlan = Tables<'subscription_plans'>;
export type Subscription = Tables<'subscriptions'>;
export type UserSubscription = Tables<'user_subscriptions'>;
export type Payment = Tables<'payments'>;
export type PaymentConfig = Tables<'payment_configs'>;

export interface SubscriptionWithPlan extends Subscription {
  plan?: SubscriptionPlan;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
  success_url: string;
  cancel_url: string;
}

class PaymentService extends BaseApiService {
  constructor() {
    super('payments');
  }

  /**
   * Get available subscription plans
   */
  async getSubscriptionPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;

      return {
        data: data || [],
        error: null,
      };
    } catch (error) {
      this.logError('getSubscriptionPlans', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Get user's current subscription
   */
  async getCurrentSubscription(userId?: string): Promise<ApiResponse<SubscriptionWithPlan | null>> {
    try {
      const targetUserId = userId || (await this.getCurrentUserId());
      if (!targetUserId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', targetUserId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return {
        data: data as SubscriptionWithPlan || null,
        error: null,
      };
    } catch (error) {
      this.logError('getCurrentSubscription', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(planId: string): Promise<ApiResponse<CheckoutSession>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      // Get plan details
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (!plan) throw new Error('Invalid plan');

      // Get payment gateway config
      const { data: config } = await supabase
        .from('payment_configs')
        .select('*')
        .eq('is_active', true)
        .single();

      if (!config) throw new Error('Payment gateway not configured');

      // Call edge function to create checkout session
      const { data: session, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          planId,
          userId,
          successUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/payment/cancel`,
        },
      });

      if (error) throw error;

      return {
        data: session,
        error: null,
      };
    } catch (error) {
      this.logError('createCheckoutSession', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<ApiResponse<UserSubscription>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      // Verify ownership
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .eq('user_id', userId)
        .single();

      if (!subscription) throw new Error('Subscription not found');

      // Call edge function to cancel in payment gateway
      const { error: cancelError } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId: subscription.payment_gateway_subscription_id },
      });

      if (cancelError) throw cancelError;

      // Update local subscription status
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;

      return {
        data,
        error: null,
      };
    } catch (error) {
      this.logError('cancelSubscription', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Resume a cancelled subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<ApiResponse<UserSubscription>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      // Verify ownership and status
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .eq('user_id', userId)
        .eq('status', 'cancelled')
        .single();

      if (!subscription) throw new Error('Subscription not found or not cancelled');

      // Call edge function to resume in payment gateway
      const { error: resumeError } = await supabase.functions.invoke('resume-subscription', {
        body: { subscriptionId: subscription.payment_gateway_subscription_id },
      });

      if (resumeError) throw resumeError;

      // Update local subscription status
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          cancelled_at: null,
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;

      return {
        data,
        error: null,
      };
    } catch (error) {
      this.logError('resumeSubscription', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(limit: number = 10): Promise<ApiResponse<Payment[]>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('payment_date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        data: data || [],
        error: null,
      };
    } catch (error) {
      this.logError('getPaymentHistory', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(paymentMethodId: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      // Get current subscription
      const { data: subscription } = await this.getCurrentSubscription();
      if (!subscription) throw new Error('No active subscription');

      // Call edge function to update payment method
      const { error } = await supabase.functions.invoke('update-payment-method', {
        body: {
          subscriptionId: subscription.payment_gateway_subscription_id,
          paymentMethodId,
        },
      });

      if (error) throw error;

      return {
        data: { success: true },
        error: null,
      };
    } catch (error) {
      this.logError('updatePaymentMethod', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Get available payment methods
   */
  async getPaymentMethods(): Promise<ApiResponse<Array<{ id: string; brand: string; last4: string; isDefault: boolean }>>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      // Call edge function to get payment methods from gateway
      const { data, error } = await supabase.functions.invoke('get-payment-methods', {
        body: { userId },
      });

      if (error) throw error;

      return {
        data: data.paymentMethods || [],
        error: null,
      };
    } catch (error) {
      this.logError('getPaymentMethods', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Apply promo code
   */
  async applyPromoCode(code: string, subscriptionId?: string): Promise<ApiResponse<{ discount: number; message: string }>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      // Validate promo code
      const { data, error } = await supabase.functions.invoke('validate-promo-code', {
        body: { code, userId, subscriptionId },
      });

      if (error) throw error;

      return {
        data,
        error: null,
      };
    } catch (error) {
      this.logError('applyPromoCode', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Get subscription usage
   */
  async getSubscriptionUsage(): Promise<ApiResponse<{
    crystalsUsed: number;
    crystalsLimit: number;
    assessmentsUsed: number;
    assessmentsLimit: number;
    voiceMinutesUsed: number;
    voiceMinutesLimit: number;
  }>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      // Get current subscription with plan details
      const { data: subscription } = await this.getCurrentSubscription();
      if (!subscription || !subscription.plan) {
        return {
          data: {
            crystalsUsed: 0,
            crystalsLimit: 100, // Free tier
            assessmentsUsed: 0,
            assessmentsLimit: 3, // Free tier
            voiceMinutesUsed: 0,
            voiceMinutesLimit: 5, // Free tier
          },
          error: null,
        };
      }

      // Get usage data
      const { data: usage, error } = await supabase.rpc('get_subscription_usage', {
        user_id_input: userId,
      });

      if (error) throw error;

      return {
        data: {
          crystalsUsed: usage.crystals_used || 0,
          crystalsLimit: subscription.plan.features?.crystals_per_month || 0,
          assessmentsUsed: usage.assessments_used || 0,
          assessmentsLimit: subscription.plan.features?.assessments_per_month || 0,
          voiceMinutesUsed: usage.voice_minutes_used || 0,
          voiceMinutesLimit: subscription.plan.features?.voice_minutes_per_month || 0,
        },
        error: null,
      };
    } catch (error) {
      this.logError('getSubscriptionUsage', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Check feature access
   */
  async checkFeatureAccess(feature: string): Promise<boolean> {
    try {
      const { data: subscription } = await this.getCurrentSubscription();
      if (!subscription || !subscription.plan) return false;

      const features = subscription.plan.features as Record<string, any>;
      return features && features[feature] === true;
    } catch (error) {
      this.logError('checkFeatureAccess', error);
      return false;
    }
  }
}

export const paymentService = new PaymentService();