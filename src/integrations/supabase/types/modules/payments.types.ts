// No Json import needed here, it's defined in the root types.ts
export type PaymentsTables = {
  subscription_packages: {
    Row: {
      created_at: string | null
      currency: string
      description: string | null
      id: string
      interval_count: number
      interval_unit: string
      is_active: boolean
      name: string
      price: number
      updated_at: string | null
    }
    Insert: {
      created_at?: string | null
      currency: string
      description?: string | null
      id?: string
      interval_count: number
      interval_unit: string
      is_active?: boolean
      name: string
      price: number
      updated_at?: string | null
    }
    Update: {
      created_at?: string | null
      currency?: string
      description?: string | null
      id?: string
      interval_count?: number
      interval_unit?: string
      is_active?: boolean
      name?: string
      price?: number
      updated_at?: string | null
    }
    Relationships: []
  }
  subscription_plans: {
    Row: {
      billing_period: string | null
      created_at: string | null
      currency: string
      description: string | null
      features: Json | null
      gateway: string | null
      gateway_plan_id: string | null
      id: string
      interval: string
      interval_count: number
      is_active: boolean | null
      is_popular: boolean | null
      name: string
      price: number
      updated_at: string | null
    }
    Insert: {
      billing_period?: string | null
      created_at?: string | null
      currency: string
      description?: string | null
      features?: Json | null
      gateway?: string | null
      gateway_plan_id?: string | null
      id: string
      interval: string
      interval_count: number
      is_active?: boolean | null
      is_popular?: boolean | null
      name: string
      price: number
      updated_at?: string | null
    }
    Update: {
      billing_period?: string | null
      created_at?: string | null
      currency?: string
      description?: string | null
      features?: Json | null
      gateway?: string | null
      gateway_plan_id?: string | null
      id?: string
      interval?: string
      interval_count?: number
      is_active?: boolean | null
      is_popular?: boolean | null
      name?: string
      price?: number
      updated_at?: string | null
    }
    Relationships: []
  }
  subscriptions: {
    Row: {
      amount: number | null
      cancel_at: string | null
      cancelled_at: string | null
      created_at: string | null
      created_time: string | null
      currency: string | null
      current_period_end: string | null
      current_period_start: string | null
      customer_email: string | null
      customer_name: string | null
      customer_phone: string | null
      end_time: string | null
      gateway: string
      gateway_subscription_id: string
      id: string
      interval_count: number | null
      interval_unit: string | null
      invoice_status: string | null
      invoice_url: string | null
      metadata: Json | null
      paypal_status: string | null
      plan_id: string | null
      plan_name: string | null
      start_time: string | null
      status: string
      trial_end: string | null
      updated_at: string | null
      user_id: string | null
      webhook_received_at: string | null
    }
    Insert: {
      amount?: number | null
      cancel_at?: string | null
      cancelled_at?: string | null
      created_at?: string | null
      created_time?: string | null
      currency?: string | null
      current_period_end?: string | null
      current_period_start?: string | null
      customer_email?: string | null
      customer_name?: string | null
      customer_phone?: string | null
      end_time?: string | null
      gateway: string
      gateway_subscription_id: string
      id?: string
      interval_count?: number | null
      interval_unit?: string | null
      invoice_status?: string | null
      invoice_url?: string | null
      metadata?: Json | null
      paypal_status?: string | null
      plan_id?: string | null
      plan_name?: string | null
      start_time?: string | null
      status?: string
      trial_end?: string | null
      updated_at?: string | null
      user_id?: string | null
      webhook_received_at?: string | null
    }
    Update: {
      amount?: number | null
      cancel_at?: string | null
      cancelled_at?: string | null
      created_at?: string | null
      created_time?: string | null
      currency?: string | null
      current_period_end?: string | null
      current_period_start?: string | null
      customer_email?: string | null
      customer_name?: string | null
      customer_phone?: string | null
      end_time?: string | null
      gateway?: string
      gateway_subscription_id?: string
      id?: string
      interval_count?: number | null
      interval_unit?: string | null
      invoice_status?: string | null
      invoice_url?: string | null
      metadata?: Json | null
      paypal_status?: string | null
      plan_id?: string | null
      plan_name?: string | null
      start_time?: string | null
      status?: string
      trial_end?: string | null
      updated_at?: string | null
      user_id?: string | null
      webhook_received_at?: string | null
    }
    Relationships: []
  }
  user_subscriptions: {
    Row: {
      cancelled_at: string | null
      created_at: string
      current_period_end: string
      current_period_start: string
      id: string
      payment_gateway_subscription_id: string
      payment_method: string
      plan_id: string
      status: string
      trial_end: string | null
      updated_at: string
      user_id: string
    }
    Insert: {
      cancelled_at?: string | null
      created_at?: string
      current_period_end: string
      current_period_start: string
      id?: string
      payment_gateway_subscription_id: string
      payment_method: string
      plan_id: string
      status: string
      trial_end?: string | null
      updated_at?: string
      user_id: string
    }
    Update: {
      cancelled_at?: string | null
      created_at?: string
      current_period_end?: string
      current_period_start?: string
      id?: string
      payment_gateway_subscription_id?: string
      payment_method?: string
      plan_id?: string
      status?: string
      trial_end?: string | null
      updated_at?: string
      user_id?: string
    }
    Relationships: [
      {
        foreignKeyName: "user_subscriptions_plan_id_fkey"
        columns: ["plan_id"]
        isOneToOne: false
        referencedRelation: "subscription_plans"
        referencedColumns: ["id"]
      },
    ]
  }
  payment_configs: {
    Row: {
      config: Json
      created_at: string | null
      gateway: string
      id: string
      is_default: boolean | null
      is_enabled: boolean | null
      updated_at: string | null
    }
    Insert: {
      config?: Json
      created_at?: string | null
      gateway: string
      id?: string
      is_default?: boolean | null
      is_enabled?: boolean | null
      updated_at?: string | null
    }
    Update: {
      config?: Json
      created_at?: string | null
      gateway?: string
      id?: string
      is_default?: boolean | null
      is_enabled?: boolean | null
      updated_at?: string | null
    }
    Relationships: []
  }
  payments: {
    Row: {
      amount: number
      created_at: string | null
      currency: string
      failure_reason: string | null
      gateway: string
      gateway_payment_id: string
      id: string
      metadata: Json | null
      payment_date: string | null
      payment_method: string | null
      status: string
      subscription_id: string | null
      updated_at: string | null
      user_id: string | null
    }
    Insert: {
      amount: number
      created_at?: string | null
      currency?: string
      failure_reason?: string | null
      gateway: string
      gateway_payment_id: string
      id?: string
      metadata?: Json | null
      payment_date?: string | null
      payment_method?: string | null
      status: string
      subscription_id?: string | null
      updated_at?: string | null
      user_id?: string | null
    }
    Update: {
      amount?: number
      created_at?: string | null
      currency?: string
      failure_reason?: string | null
      gateway?: string
      gateway_payment_id?: string
      id?: string
      metadata?: Json | null
      payment_date?: string | null
      payment_method?: string | null
      status?: string
      subscription_id?: string | null
      updated_at?: string | null
      user_id?: string | null
    }
    Relationships: [
      {
        foreignKeyName: "payments_subscription_id_fkey"
        columns: ["subscription_id"]
        isOneToOne: false
        referencedRelation: "subscriptions"
        referencedColumns: ["id"]
      },
    ]
  }
  payment_failures: {
    Row: {
      created_at: string
      failure_reason: string
      gateway: string
      id: string
      invoice_id: string | null
      max_retries: number | null
      next_retry_at: string | null
      resolved_at: string | null
      retry_count: number | null
      subscription_id: string | null
      updated_at: string
      user_id: string
    }
    Insert: {
      created_at?: string
      failure_reason: string
      gateway: string
      id?: string
      invoice_id?: string | null
      max_retries?: number | null
      next_retry_at?: string | null
      resolved_at?: string | null
      retry_count?: number | null
      subscription_id?: string | null
      updated_at?: string
      user_id: string
    }
    Update: {
      created_at?: string
      failure_reason?: string
      gateway?: string
      id?: string
      invoice_id?: string | null
      max_retries?: number | null
      next_retry_at?: string | null
      resolved_at?: string | null
      retry_count?: number | null
      subscription_id?: string | null
      updated_at?: string
      user_id?: string
    }
    Relationships: []
  }
  usage_limits: {
    Row: {
      created_at: string | null
      feature: string
      id: string
      limit_value: number
      package_id: string
      updated_at: string | null
    }
    Insert: {
      created_at?: string | null
      feature: string
      id?: string
      limit_value: number
      package_id: string
      updated_at?: string | null
    }
    Update: {
      created_at?: string | null
      feature?: string
      id?: string
      limit_value?: number
      package_id?: string
      updated_at?: string | null
    }
    Relationships: [
      {
        foreignKeyName: "usage_limits_package_id_fkey"
        columns: ["package_id"]
        isOneToOne: false
        referencedRelation: "subscription_packages"
        referencedColumns: ["id"]
      },
    ]
  }
  webhook_logs: {
    Row: {
      created_at: string | null
      error_message: string | null
      event_type: string
      gateway: string
      id: string
      payload: Json
      processed_at: string | null
      retry_count: number | null
      status: string
    }
    Insert: {
      created_at?: string | null
      error_message?: string | null
      event_type: string
      gateway: string
      id?: string
      payload: Json
      processed_at?: string | null
      retry_count?: number | null
      status?: string
    }
    Update: {
      created_at?: string | null
      error_message?: string | null
      event_type?: string
      gateway?: string
      id?: string
      payload?: Json
      processed_at?: string | null
      retry_count?: number | null
      status?: string
    }
    Relationships: []
  }
};