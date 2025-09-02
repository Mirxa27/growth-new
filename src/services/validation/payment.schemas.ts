import { z } from 'zod';

/**
 * Payment and Subscription Validation Schemas
 */

export const CreatePaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const UpdateSubscriptionSchema = z.object({
  planId: z.string().uuid('Invalid plan ID'),
  paymentMethodId: z.string().optional(),
  promoCode: z.string().optional(),
});

export const CreateSubscriptionPlanSchema = z.object({
  name: z.string().min(2, 'Plan name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(0, 'Price cannot be negative'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  billing_period: z.enum(['monthly', 'quarterly', 'yearly']),
  features: z.object({
    crystals_per_month: z.number().int().min(0),
    assessments_per_month: z.number().int().min(0),
    voice_minutes_per_month: z.number().int().min(0),
    ai_chat_unlimited: z.boolean(),
    community_access: z.boolean(),
    priority_support: z.boolean(),
    custom_assessments: z.boolean(),
    group_sessions: z.boolean(),
    api_access: z.boolean(),
  }),
  is_active: z.boolean().default(true),
  trial_days: z.number().int().min(0).max(365).optional(),
});

export const PaymentMethodSchema = z.object({
  type: z.enum(['card', 'bank_transfer', 'paypal', 'crypto']),
  details: z.object({
    brand: z.string().optional(),
    last4: z.string().length(4).optional(),
    expMonth: z.number().int().min(1).max(12).optional(),
    expYear: z.number().int().min(new Date().getFullYear()).optional(),
  }).optional(),
});

export const PromoCodeSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9_-]+$/i, 'Invalid promo code format'),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  maxUses: z.number().int().positive().optional(),
  applicablePlans: z.array(z.string().uuid()).optional(),
});

export const RefundRequestSchema = z.object({
  paymentId: z.string().uuid(),
  reason: z.string().min(10, 'Please provide a detailed reason'),
  amount: z.number().positive().optional(), // For partial refunds
});

export const WebhookPayloadSchema = z.object({
  event: z.string(),
  data: z.object({
    object: z.string(),
    id: z.string(),
    amount: z.number().optional(),
    currency: z.string().optional(),
    status: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
  created: z.number(),
});

/**
 * Validation helpers
 */
export const validateCreditCard = (cardNumber: string): boolean => {
  // Remove spaces and dashes
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  
  // Check if it's a valid length
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

export const validateExpiryDate = (month: number, year: number): boolean => {
  const now = new Date();
  const expiry = new Date(year, month - 1);
  return expiry > now;
};

export const getCardBrand = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  
  if (/^4/.test(cleaned)) return 'Visa';
  if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
  if (/^3[47]/.test(cleaned)) return 'American Express';
  if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
  if (/^(?:2131|1800|35)/.test(cleaned)) return 'JCB';
  if (/^3(?:0[0-5]|[68])/.test(cleaned)) return 'Diners Club';
  
  return 'Unknown';
};