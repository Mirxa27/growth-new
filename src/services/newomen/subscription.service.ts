/**
 * Subscription Service for Newomen
 * Manages PayPal subscriptions and minute tracking
 */

import { supabase } from '@/integrations/supabase/client';
import { loadScript } from '@paypal/paypal-js';

export interface SubscriptionTier {
  id: 'discovery' | 'growth' | 'transformation';
  name: string;
  price: number;
  minutes: number;
  features: string[];
  popular?: boolean;
  paypalPlanId?: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTier['id'];
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  minutesTotal: number;
  minutesUsed: number;
  minutesRemaining: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  paypalSubscriptionId?: string;
  autoRenew: boolean;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  tier: SubscriptionTier['id'];
  paymentMethod: 'paypal' | 'card' | 'free';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paypalOrderId?: string;
  createdAt: string;
}

export interface UsageTracking {
  date: string;
  minutesUsed: number;
  sessionsCount: number;
  averageSessionLength: number;
  emotionalProgress: number;
}

class SubscriptionService {
  private paypalClient: any = null;
  private readonly PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  
  private readonly SUBSCRIPTION_TIERS: SubscriptionTier[] = [
    {
      id: 'discovery',
      name: 'Discovery',
      price: 0,
      minutes: 10,
      features: [
        '10 free minutes of conversation',
        'Basic emotion detection',
        'Introduction to shadow work',
        'Text transcripts'
      ]
    },
    {
      id: 'growth',
      name: 'Growth',
      price: 22,
      minutes: 100,
      features: [
        '100 minutes of conversation',
        'Advanced emotion detection',
        'Complete shadow work journey',
        'Personalized integration plans',
        'Session recordings',
        'Weekly progress reports'
      ],
      popular: true,
      paypalPlanId: import.meta.env.VITE_PAYPAL_GROWTH_PLAN_ID
    },
    {
      id: 'transformation',
      name: 'Transformation',
      price: 222,
      minutes: 1000,
      features: [
        '1000 minutes of conversation',
        'Priority AI responses',
        'All conversation modes',
        'Advanced analytics',
        'Custom voice selection',
        'Downloadable insights',
        'Priority support',
        'Early access to features'
      ],
      paypalPlanId: import.meta.env.VITE_PAYPAL_TRANSFORMATION_PLAN_ID
    }
  ];

  constructor() {
    this.initializePayPal();
  }

  /**
   * Initialize PayPal SDK
   */
  private async initializePayPal(): Promise<void> {
    if (!this.PAYPAL_CLIENT_ID) {
      console.warn('PayPal client ID not configured');
      return;
    }

    try {
      this.paypalClient = await loadScript({
        'client-id': this.PAYPAL_CLIENT_ID,
        currency: 'USD',
        intent: 'subscription',
        vault: true,
        components: 'buttons,funding-eligibility'
      });
    } catch (error) {
      console.error('Failed to load PayPal SDK:', error);
    }
  }

  /**
   * Get all subscription tiers
   */
  getSubscriptionTiers(): SubscriptionTier[] {
    return this.SUBSCRIPTION_TIERS;
  }

  /**
   * Get specific tier
   */
  getTier(tierId: SubscriptionTier['id']): SubscriptionTier | undefined {
    return this.SUBSCRIPTION_TIERS.find(tier => tier.id === tierId);
  }

  /**
   * Get user's current subscription
   */
  async getCurrentSubscription(): Promise<UserSubscription | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      // Check if user has discovery tier
      return this.getOrCreateDiscoverySubscription(user.id);
    }

    return this.mapSubscriptionData(data);
  }

  /**
   * Get or create discovery subscription
   */
  private async getOrCreateDiscoverySubscription(userId: string): Promise<UserSubscription> {
    // Check if discovery subscription exists
    const { data: existing } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('tier', 'discovery')
      .single();

    if (existing) {
      return this.mapSubscriptionData(existing);
    }

    // Create discovery subscription
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const subscription: Partial<UserSubscription> = {
      userId,
      tier: 'discovery',
      status: 'active',
      minutesTotal: 10,
      minutesUsed: 0,
      minutesRemaining: 10,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: endDate.toISOString(),
      autoRenew: false
    };

    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        tier: 'discovery',
        status: 'active',
        minutes_total: 10,
        minutes_used: 0,
        minutes_remaining: 10,
        current_period_start: subscription.currentPeriodStart,
        current_period_end: subscription.currentPeriodEnd,
        auto_renew: false
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapSubscriptionData(data);
  }

  /**
   * Create PayPal subscription
   */
  async createPayPalSubscription(
    tierId: 'growth' | 'transformation'
  ): Promise<{ subscriptionId: string; approvalUrl: string }> {
    if (!this.paypalClient) {
      throw new Error('PayPal not initialized');
    }

    const tier = this.getTier(tierId);
    if (!tier || !tier.paypalPlanId) {
      throw new Error('Invalid subscription tier');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    return new Promise((resolve, reject) => {
      // Render PayPal button
      this.paypalClient.Buttons({
        createSubscription: (data: any, actions: any) => {
          return actions.subscription.create({
            plan_id: tier.paypalPlanId,
            subscriber: {
              email_address: user.email,
              name: {
                given_name: user.user_metadata?.first_name || '',
                surname: user.user_metadata?.last_name || ''
              }
            },
            application_context: {
              brand_name: 'Newomen',
              locale: 'en-US',
              shipping_preference: 'NO_SHIPPING',
              user_action: 'SUBSCRIBE_NOW',
              payment_method: {
                payer_selected: 'PAYPAL',
                payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
              }
            }
          });
        },
        onApprove: async (data: any) => {
          // Save subscription to database
          await this.activateSubscription(tierId, data.subscriptionID);
          resolve({
            subscriptionId: data.subscriptionID,
            approvalUrl: ''
          });
        },
        onError: (err: any) => {
          console.error('PayPal error:', err);
          reject(err);
        },
        onCancel: () => {
          reject(new Error('Subscription cancelled by user'));
        }
      });
    });
  }

  /**
   * Activate subscription after PayPal approval
   */
  async activateSubscription(
    tierId: SubscriptionTier['id'],
    paypalSubscriptionId: string
  ): Promise<UserSubscription> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const tier = this.getTier(tierId);
    if (!tier) throw new Error('Invalid tier');

    // Cancel existing subscription if any
    await this.cancelCurrentSubscription();

    // Create new subscription
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        tier: tierId,
        status: 'active',
        minutes_total: tier.minutes,
        minutes_used: 0,
        minutes_remaining: tier.minutes,
        current_period_start: now.toISOString(),
        current_period_end: endDate.toISOString(),
        paypal_subscription_id: paypalSubscriptionId,
        auto_renew: true
      })
      .select()
      .single();

    if (error) throw error;

    // Record payment
    await this.recordPayment(user.id, tier, 'completed', paypalSubscriptionId);

    // Send confirmation email
    await this.sendSubscriptionConfirmation(user.email!, tier);

    return this.mapSubscriptionData(data);
  }

  /**
   * Cancel current subscription
   */
  async cancelCurrentSubscription(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update subscription status
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        auto_renew: false,
        cancelled_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('status', 'active');

    // Cancel PayPal subscription if exists
    const { data } = await supabase
      .from('user_subscriptions')
      .select('paypal_subscription_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (data?.paypal_subscription_id) {
      await this.cancelPayPalSubscription(data.paypal_subscription_id);
    }
  }

  /**
   * Cancel PayPal subscription
   */
  private async cancelPayPalSubscription(subscriptionId: string): Promise<void> {
    // Call PayPal API to cancel subscription
    try {
      const response = await fetch(`/api/paypal/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'User requested cancellation'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel PayPal subscription');
      }
    } catch (error) {
      console.error('Error cancelling PayPal subscription:', error);
    }
  }

  /**
   * Use minutes from subscription
   */
  async useMinutes(minutes: number): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const subscription = await this.getCurrentSubscription();
    if (!subscription) return false;

    if (subscription.minutesRemaining < minutes) {
      return false; // Not enough minutes
    }

    const newUsed = subscription.minutesUsed + minutes;
    const newRemaining = subscription.minutesTotal - newUsed;

    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        minutes_used: newUsed,
        minutes_remaining: newRemaining,
        last_usage_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (error) {
      console.error('Failed to update minutes:', error);
      return false;
    }

    // Track usage
    await this.trackUsage(user.id, minutes);

    // Check if running low
    if (newRemaining < 10 && newRemaining > 0) {
      await this.sendLowMinutesNotification(user.email!, newRemaining);
    }

    return true;
  }

  /**
   * Track usage for analytics
   */
  private async trackUsage(userId: string, minutes: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    // Check if record exists for today
    const { data: existing } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (existing) {
      // Update existing record
      await supabase
        .from('usage_tracking')
        .update({
          minutes_used: existing.minutes_used + minutes,
          sessions_count: existing.sessions_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new record
      await supabase
        .from('usage_tracking')
        .insert({
          user_id: userId,
          date: today,
          minutes_used: minutes,
          sessions_count: 1
        });
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(): Promise<PaymentHistory[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get payment history:', error);
      return [];
    }

    return data.map(this.mapPaymentData);
  }

  /**
   * Get usage statistics
   */
  async getUsageStatistics(days: number = 30): Promise<UsageTracking[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('Failed to get usage statistics:', error);
      return [];
    }

    return data.map(this.mapUsageData);
  }

  /**
   * Check if user can access premium features
   */
  async canAccessPremiumFeatures(): Promise<boolean> {
    const subscription = await this.getCurrentSubscription();
    if (!subscription) return false;

    return subscription.tier !== 'discovery' && 
           subscription.status === 'active' && 
           subscription.minutesRemaining > 0;
  }

  /**
   * Get recommended tier based on usage
   */
  async getRecommendedTier(): Promise<SubscriptionTier['id']> {
    const usage = await this.getUsageStatistics(7); // Last 7 days
    
    if (usage.length === 0) {
      return 'discovery';
    }

    const totalMinutes = usage.reduce((sum, day) => sum + day.minutesUsed, 0);
    const avgDaily = totalMinutes / 7;

    if (avgDaily > 10) {
      return 'transformation'; // Heavy user
    } else if (avgDaily > 3) {
      return 'growth'; // Regular user
    } else {
      return 'discovery'; // Light user
    }
  }

  /**
   * Record payment
   */
  private async recordPayment(
    userId: string,
    tier: SubscriptionTier,
    status: PaymentHistory['status'],
    paypalOrderId?: string
  ): Promise<void> {
    await supabase
      .from('payment_history')
      .insert({
        user_id: userId,
        amount: tier.price,
        currency: 'USD',
        tier: tier.id,
        payment_method: tier.price === 0 ? 'free' : 'paypal',
        status,
        paypal_order_id: paypalOrderId,
        created_at: new Date().toISOString()
      });
  }

  /**
   * Send subscription confirmation email
   */
  private async sendSubscriptionConfirmation(email: string, tier: SubscriptionTier): Promise<void> {
    // Implementation would use email service
    console.log(`Sending confirmation email to ${email} for ${tier.name} tier`);
  }

  /**
   * Send low minutes notification
   */
  private async sendLowMinutesNotification(email: string, remaining: number): Promise<void> {
    // Implementation would use notification service
    console.log(`Sending low minutes notification to ${email}: ${remaining} minutes remaining`);
  }

  /**
   * Map subscription data from database
   */
  private mapSubscriptionData(data: any): UserSubscription {
    return {
      id: data.id,
      userId: data.user_id,
      tier: data.tier,
      status: data.status,
      minutesTotal: data.minutes_total,
      minutesUsed: data.minutes_used,
      minutesRemaining: data.minutes_remaining,
      currentPeriodStart: data.current_period_start,
      currentPeriodEnd: data.current_period_end,
      paypalSubscriptionId: data.paypal_subscription_id,
      autoRenew: data.auto_renew
    };
  }

  /**
   * Map payment data from database
   */
  private mapPaymentData(data: any): PaymentHistory {
    return {
      id: data.id,
      userId: data.user_id,
      amount: data.amount,
      currency: data.currency,
      tier: data.tier,
      paymentMethod: data.payment_method,
      status: data.status,
      paypalOrderId: data.paypal_order_id,
      createdAt: data.created_at
    };
  }

  /**
   * Map usage data from database
   */
  private mapUsageData(data: any): UsageTracking {
    return {
      date: data.date,
      minutesUsed: data.minutes_used,
      sessionsCount: data.sessions_count,
      averageSessionLength: data.minutes_used / data.sessions_count,
      emotionalProgress: data.emotional_progress || 0
    };
  }

  /**
   * Handle webhook from PayPal
   */
  async handlePayPalWebhook(event: any): Promise<void> {
    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        // Subscription activated
        await this.handleSubscriptionActivated(event.resource);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        // Subscription cancelled
        await this.handleSubscriptionCancelled(event.resource);
        break;

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        // Subscription expired
        await this.handleSubscriptionExpired(event.resource);
        break;

      case 'PAYMENT.SALE.COMPLETED':
        // Payment completed
        await this.handlePaymentCompleted(event.resource);
        break;

      default:
        console.log('Unhandled PayPal webhook event:', event.event_type);
    }
  }

  /**
   * Handle subscription activated
   */
  private async handleSubscriptionActivated(resource: any): Promise<void> {
    // Update subscription status in database
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        activated_at: new Date().toISOString()
      })
      .eq('paypal_subscription_id', resource.id);
  }

  /**
   * Handle subscription cancelled
   */
  private async handleSubscriptionCancelled(resource: any): Promise<void> {
    // Update subscription status in database
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        auto_renew: false
      })
      .eq('paypal_subscription_id', resource.id);
  }

  /**
   * Handle subscription expired
   */
  private async handleSubscriptionExpired(resource: any): Promise<void> {
    // Update subscription status in database
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'expired',
        expired_at: new Date().toISOString()
      })
      .eq('paypal_subscription_id', resource.id);
  }

  /**
   * Handle payment completed
   */
  private async handlePaymentCompleted(resource: any): Promise<void> {
    // Record payment in history
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('user_id, tier')
      .eq('paypal_subscription_id', resource.billing_agreement_id)
      .single();

    if (subscription) {
      const tier = this.getTier(subscription.tier);
      if (tier) {
        await this.recordPayment(
          subscription.user_id,
          tier,
          'completed',
          resource.id
        );
      }
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();