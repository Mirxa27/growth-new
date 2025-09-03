import { BaseService } from './base.service';
import { z } from 'zod';
import { apiClient } from './client.service';

// PayPal Configuration
export interface PayPalConfig {
  client_id: string;
  client_secret: string;
  mode: 'sandbox' | 'live';
  currency: string;
}

// PayPal Plans
export const PayPalPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'CREATED']),
  billing_cycles: z.array(z.object({
    frequency: z.object({
      interval_unit: z.enum(['DAY', 'WEEK', 'MONTH', 'YEAR']),
      interval_count: z.number()
    }),
    tenure_type: z.enum(['REGULAR', 'TRIAL']),
    sequence: z.number(),
    total_cycles: z.number().optional(),
    pricing_scheme: z.object({
      fixed_price: z.object({
        value: z.string(),
        currency_code: z.string()
      })
    })
  })),
  payment_preferences: z.object({
    auto_bill_outstanding: z.boolean(),
    setup_fee: z.object({
      value: z.string(),
      currency_code: z.string()
    }).optional(),
    setup_fee_failure_action: z.enum(['CONTINUE', 'CANCEL']).optional(),
    payment_failure_threshold: z.number().optional()
  })
});

// PayPal Subscription
export const PayPalSubscriptionSchema = z.object({
  id: z.string(),
  plan_id: z.string(),
  status: z.enum(['APPROVAL_PENDING', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED']),
  status_update_time: z.string(),
  start_time: z.string(),
  quantity: z.string(),
  subscriber: z.object({
    name: z.object({
      given_name: z.string().optional(),
      surname: z.string().optional()
    }).optional(),
    email_address: z.string().email(),
    payer_id: z.string()
  }),
  billing_info: z.object({
    outstanding_balance: z.object({
      value: z.string(),
      currency_code: z.string()
    }),
    cycle_executions: z.array(z.any()).optional(),
    last_payment: z.object({
      amount: z.object({
        value: z.string(),
        currency_code: z.string()
      }),
      time: z.string()
    }).optional(),
    next_billing_time: z.string().optional(),
    failed_payments_count: z.number()
  }).optional()
});

// PayPal Order
export const PayPalOrderSchema = z.object({
  id: z.string(),
  status: z.enum(['CREATED', 'SAVED', 'APPROVED', 'VOIDED', 'COMPLETED', 'PAYER_ACTION_REQUIRED']),
  intent: z.enum(['CAPTURE', 'AUTHORIZE']),
  purchase_units: z.array(z.object({
    reference_id: z.string().optional(),
    amount: z.object({
      currency_code: z.string(),
      value: z.string(),
      breakdown: z.object({
        item_total: z.object({
          currency_code: z.string(),
          value: z.string()
        }).optional(),
        shipping: z.object({
          currency_code: z.string(),
          value: z.string()
        }).optional(),
        tax_total: z.object({
          currency_code: z.string(),
          value: z.string()
        }).optional()
      }).optional()
    }),
    items: z.array(z.object({
      name: z.string(),
      unit_amount: z.object({
        currency_code: z.string(),
        value: z.string()
      }),
      quantity: z.string(),
      description: z.string().optional()
    })).optional()
  })),
  payer: z.object({
    name: z.object({
      given_name: z.string().optional(),
      surname: z.string().optional()
    }).optional(),
    email_address: z.string().email(),
    payer_id: z.string().optional()
  }).optional(),
  create_time: z.string(),
  update_time: z.string(),
  links: z.array(z.object({
    href: z.string(),
    rel: z.string(),
    method: z.enum(['GET', 'POST', 'PATCH', 'DELETE'])
  }))
});

// Create schemas
export const CreatePayPalPlanSchema = z.object({
  product_id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  billing_cycles: PayPalPlanSchema.shape.billing_cycles,
  payment_preferences: PayPalPlanSchema.shape.payment_preferences
});

export const CreatePayPalSubscriptionSchema = z.object({
  plan_id: z.string(),
  start_time: z.string().optional(),
  quantity: z.string().optional().default('1'),
  subscriber: z.object({
    name: z.object({
      given_name: z.string(),
      surname: z.string()
    }).optional(),
    email_address: z.string().email()
  }),
  application_context: z.object({
    brand_name: z.string().optional(),
    locale: z.string().optional().default('en-US'),
    shipping_preference: z.enum(['SET_PROVIDED_ADDRESS', 'NO_SHIPPING', 'GET_FROM_FILE']).optional().default('NO_SHIPPING'),
    user_action: z.enum(['SUBSCRIBE_NOW', 'CONTINUE']).optional().default('SUBSCRIBE_NOW'),
    payment_method: z.object({
      payer_selected: z.string().optional().default('PAYPAL'),
      payee_preferred: z.enum(['UNRESTRICTED', 'IMMEDIATE_PAYMENT_REQUIRED']).optional().default('IMMEDIATE_PAYMENT_REQUIRED')
    }).optional(),
    return_url: z.string().url(),
    cancel_url: z.string().url()
  })
});

// Types
export type PayPalPlan = z.infer<typeof PayPalPlanSchema>;
export type PayPalSubscription = z.infer<typeof PayPalSubscriptionSchema>;
export type PayPalOrder = z.infer<typeof PayPalOrderSchema>;
export type CreatePayPalPlan = z.infer<typeof CreatePayPalPlanSchema>;
export type CreatePayPalSubscription = z.infer<typeof CreatePayPalSubscriptionSchema>;

class PayPalService extends BaseService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Get PayPal access token
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const response = await apiClient.post('/api/paypal/oauth2/token', {
      grant_type: 'client_credentials'
    });

    this.accessToken = response.access_token;
    this.tokenExpiry = Date.now() + (response.expires_in * 1000) - 60000; // Refresh 1 minute before expiry

    return this.accessToken;
  }

  /**
   * Create a product (required for subscription plans)
   */
  async createProduct(data: {
    name: string;
    description?: string;
    type?: 'PHYSICAL' | 'DIGITAL' | 'SERVICE';
    category?: string;
    image_url?: string;
    home_url?: string;
  }): Promise<{ id: string; name: string }> {
    const token = await this.getAccessToken();
    
    return apiClient.post('/api/paypal/catalogs/products', {
      ...data,
      type: data.type || 'SERVICE'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  /**
   * Create a subscription plan
   */
  async createPlan(data: CreatePayPalPlan): Promise<PayPalPlan> {
    const validatedData = this.validate(CreatePayPalPlanSchema, data);
    const token = await this.getAccessToken();
    
    return apiClient.post('/api/paypal/billing/plans', validatedData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  /**
   * List subscription plans
   */
  async listPlans(options?: {
    product_id?: string;
    plan_ids?: string;
    page_size?: number;
    page?: number;
    total_required?: boolean;
  }): Promise<{ plans: PayPalPlan[]; total_items?: number; total_pages?: number }> {
    const token = await this.getAccessToken();
    
    return apiClient.get('/api/paypal/billing/plans', {
      params: options,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  /**
   * Get plan details
   */
  async getPlan(planId: string): Promise<PayPalPlan> {
    const token = await this.getAccessToken();
    
    return apiClient.get(`/api/paypal/billing/plans/${planId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  /**
   * Create a subscription
   */
  async createSubscription(data: CreatePayPalSubscription): Promise<PayPalSubscription> {
    const validatedData = this.validate(CreatePayPalSubscriptionSchema, data);
    const token = await this.getAccessToken();
    
    return apiClient.post('/api/paypal/billing/subscriptions', validatedData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<PayPalSubscription> {
    const token = await this.getAccessToken();
    
    return apiClient.get(`/api/paypal/billing/subscriptions/${subscriptionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, reason: string): Promise<void> {
    const token = await this.getAccessToken();
    
    await apiClient.post(`/api/paypal/billing/subscriptions/${subscriptionId}/cancel`, {
      reason
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  /**
   * Suspend subscription
   */
  async suspendSubscription(subscriptionId: string, reason: string): Promise<void> {
    const token = await this.getAccessToken();
    
    await apiClient.post(`/api/paypal/billing/subscriptions/${subscriptionId}/suspend`, {
      reason
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(subscriptionId: string, reason: string): Promise<void> {
    const token = await this.getAccessToken();
    
    await apiClient.post(`/api/paypal/billing/subscriptions/${subscriptionId}/activate`, {
      reason
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  /**
   * Create an order for one-time payment
   */
  async createOrder(data: {
    intent: 'CAPTURE' | 'AUTHORIZE';
    purchase_units: Array<{
      amount: {
        currency_code: string;
        value: string;
      };
      description?: string;
    }>;
    application_context?: {
      return_url: string;
      cancel_url: string;
      brand_name?: string;
      locale?: string;
      landing_page?: 'LOGIN' | 'BILLING' | 'NO_PREFERENCE';
      shipping_preference?: 'GET_FROM_FILE' | 'NO_SHIPPING' | 'SET_PROVIDED_ADDRESS';
      user_action?: 'CONTINUE' | 'PAY_NOW';
    };
  }): Promise<PayPalOrder> {
    const token = await this.getAccessToken();
    
    return apiClient.post('/api/paypal/checkout/orders', data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  /**
   * Capture payment for an order
   */
  async captureOrder(orderId: string): Promise<PayPalOrder> {
    const token = await this.getAccessToken();
    
    return apiClient.post(`/api/paypal/checkout/orders/${orderId}/capture`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  /**
   * Handle webhook
   */
  async handleWebhook(headers: Record<string, string>, body: any): Promise<void> {
    // Verify webhook signature
    const verified = await this.verifyWebhookSignature(headers, body);
    if (!verified) {
      throw new Error('Invalid webhook signature');
    }

    // Process webhook based on event type
    switch (body.event_type) {
      case 'BILLING.SUBSCRIPTION.CREATED':
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.UPDATED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await this.handleSubscriptionEvent(body);
        break;

      case 'PAYMENT.CAPTURE.COMPLETED':
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REFUNDED':
        await this.handlePaymentEvent(body);
        break;

      default:
        console.log('Unhandled webhook event:', body.event_type);
    }
  }

  /**
   * Verify webhook signature
   */
  private async verifyWebhookSignature(headers: Record<string, string>, body: any): Promise<boolean> {
    const token = await this.getAccessToken();
    
    try {
      const response = await apiClient.post('/api/paypal/notifications/verify-webhook-signature', {
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: process.env.VITE_PAYPAL_WEBHOOK_ID,
        webhook_event: body
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.verification_status === 'SUCCESS';
    } catch (error) {
      console.error('Webhook verification failed:', error);
      return false;
    }
  }

  /**
   * Handle subscription events
   */
  private async handleSubscriptionEvent(event: any): Promise<void> {
    const { resource } = event;
    
    // Update local database with subscription status
    await apiClient.post('/api/subscriptions/sync-paypal', {
      subscription_id: resource.id,
      status: resource.status,
      plan_id: resource.plan_id,
      subscriber: resource.subscriber,
      billing_info: resource.billing_info
    });
  }

  /**
   * Handle payment events
   */
  private async handlePaymentEvent(event: any): Promise<void> {
    const { resource } = event;
    
    // Record payment in local database
    await apiClient.post('/api/payments/record-paypal', {
      payment_id: resource.id,
      amount: resource.amount,
      status: resource.status,
      payer: resource.payer
    });
  }
}

export const paypalService = new PayPalService('/api/paypal');