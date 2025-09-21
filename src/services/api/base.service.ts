/**
 * Base API Service
 * Provides common functionality for all API services
 */

import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';
import { z } from 'zod';
import { validateDTO } from '@/services/validation/schemas';
import { logger } from '@/utils/logger';

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  count?: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
  statusCode?: number;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterOptions {
  [key: string]: unknown;
}

type OrderOptions = { ascending?: boolean };

type PaginatableQuery<T> = {
  range(from: number, to: number): T;
  order(column: string, options?: OrderOptions): T;
};

type FilterableQuery<T> = PaginatableQuery<T> & {
  eq(column: string, value: unknown): T;
  neq(column: string, value: unknown): T;
  gt(column: string, value: unknown): T;
  gte(column: string, value: unknown): T;
  lt(column: string, value: unknown): T;
  lte(column: string, value: unknown): T;
  like(column: string, value: string): T;
  ilike(column: string, value: string): T;
  contains(column: string, value: unknown): T;
  containedBy(column: string, value: unknown): T;
  ['in'](column: string, values: unknown[]): T;
};

type OperatorFilter = {
  operator: string;
  value: unknown;
};

const isOperatorFilter = (value: unknown): value is OperatorFilter => (
  typeof value === 'object'
  && value !== null
  && !Array.isArray(value)
  && 'operator' in value
  && 'value' in value
);

export abstract class BaseApiService {
  protected tableName: string;
  
  constructor(tableName: string) {
    this.tableName = tableName;
  }
  
  /**
   * Handle Supabase errors and convert to ApiError
   */
  protected handleError(error: PostgrestError | Error | unknown): ApiError {
    if (error instanceof Error) {
      const extended = error as Error & { code?: string; details?: unknown; status?: number };
      return {
        message: error.message,
        code: extended.code,
        details: extended.details,
        statusCode: extended.status,
      };
    }

    if (typeof error === 'object' && error !== null) {
      const pgError = error as PostgrestError;
      return {
        message: pgError.message || 'An unexpected error occurred',
        code: pgError.code,
        details: pgError.details,
        statusCode: (pgError as { status?: number }).status,
      };
    }
    
    return {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };
  }
  
  /**
   * Log errors in development mode
   */
  protected logError(context: string, error: unknown): void {
    logger.error(`Error in ${context}`, this.tableName, error);
  }
  
  /**
   * Apply pagination to a query
   */
  protected applyPagination<TQuery extends PaginatableQuery<TQuery>>(
    query: TQuery,
    options?: PaginationOptions
  ): TQuery {
    if (!options) return query;

    const { page = 1, pageSize = 10, sortBy, sortOrder = 'desc' } = options;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let paginatedQuery = query.range(from, to);

    if (sortBy) {
      paginatedQuery = paginatedQuery.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    return paginatedQuery;
  }
  
  /**
   * Apply filters to a query
   */
  protected applyFilters<TQuery extends FilterableQuery<TQuery>>(
    query: TQuery,
    filters?: FilterOptions
  ): TQuery {
    if (!filters) return query;

    let filteredQuery = query;

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      if (Array.isArray(value)) {
        filteredQuery = filteredQuery['in'](key, value as unknown[]);
        return;
      }

      if (isOperatorFilter(value)) {
        const { operator, value: filterValue } = value;
        switch (operator) {
          case 'eq':
            filteredQuery = filteredQuery.eq(key, filterValue);
            break;
          case 'neq':
            filteredQuery = filteredQuery.neq(key, filterValue);
            break;
          case 'gt':
            filteredQuery = filteredQuery.gt(key, filterValue);
            break;
          case 'gte':
            filteredQuery = filteredQuery.gte(key, filterValue);
            break;
          case 'lt':
            filteredQuery = filteredQuery.lt(key, filterValue);
            break;
          case 'lte':
            filteredQuery = filteredQuery.lte(key, filterValue);
            break;
          case 'like':
            filteredQuery = filteredQuery.like(key, String(filterValue));
            break;
          case 'ilike':
            filteredQuery = filteredQuery.ilike(key, String(filterValue));
            break;
          case 'contains':
            filteredQuery = filteredQuery.contains(key, filterValue);
            break;
          case 'containedBy':
            filteredQuery = filteredQuery.containedBy(key, filterValue);
            break;
          default:
            filteredQuery = filteredQuery.eq(key, filterValue);
            break;
        }
        return;
      }

      filteredQuery = filteredQuery.eq(key, value);
    });

    return filteredQuery;
  }
  
  /**
   * Generic find all with pagination and filters
   */
  async findAll<T>(
    options?: {
      pagination?: PaginationOptions;
      filters?: FilterOptions;
      select?: string;
    }
  ): Promise<ApiResponse<T[]>> {
    try {
      let query = supabase.from(this.tableName).select(options?.select || '*', { count: 'exact' });
      
      query = this.applyFilters(query, options?.filters);
      query = this.applyPagination(query, options?.pagination);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        data: data as T[],
        error: null,
        count: count ?? undefined,
      };
    } catch (error) {
      this.logError('findAll', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Generic find by ID
   */
  async findById<T>(id: string, select?: string): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(select || '*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return {
        data: data as T,
        error: null,
      };
    } catch (error) {
      this.logError('findById', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Generic create
   */
  async create<T>(payload: Partial<T>): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert(payload)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: data as T,
        error: null,
      };
    } catch (error) {
      this.logError('create', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Generic update
   */
  async update<T>(id: string, payload: Partial<T>): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: data as T,
        error: null,
      };
    } catch (error) {
      this.logError('update', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Generic delete
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return {
        data: null,
        error: null,
      };
    } catch (error) {
      this.logError('delete', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Batch create
   */
  async createMany<T>(payloads: Partial<T>[]): Promise<ApiResponse<T[]>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert(payloads)
        .select();
      
      if (error) throw error;
      
      return {
        data: data as T[],
        error: null,
      };
    } catch (error) {
      this.logError('createMany', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Batch update
   */
  async updateMany<T>(
    updates: Array<{ id: string; payload: Partial<T> }>
  ): Promise<ApiResponse<T[]>> {
    try {
      const results = await Promise.all(
        updates.map(({ id, payload }) => this.update<T>(id, payload))
      );
      
      const errors = results.filter(r => r.error !== null);
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} items`);
      }
      
      return {
        data: results.map(r => r.data).filter(Boolean) as T[],
        error: null,
      };
    } catch (error) {
      this.logError('updateMany', error);
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }
  
  /**
   * Check if record exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('id', id);
      
      if (error) throw error;
      
      return (count ?? 0) > 0;
    } catch (error) {
      this.logError('exists', error);
      return false;
    }
  }

  /**
   * Validate data against a schema with detailed error handling
   */
  protected validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    const result = validateDTO(schema, data);
    
    if (!result.success) {
      const errorMessage = result.errors
        .map(err => `${err.field}: ${err.message}`)
        .join(', ');
      
      throw new Error(`Validation failed: ${errorMessage}`);
    }
    
    return result.data;
  }

  /**
   * Validate data and return ApiResponse
   */
  protected async validateAndExecute<T, R>(
    schema: z.ZodSchema<T>,
    data: unknown,
    executor: (validData: T) => Promise<R>
  ): Promise<ApiResponse<R>> {
    try {
      const validData = this.validate(schema, data);
      const result = await executor(validData);
      
      return {
        data: result,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error),
      };
    }
  }

  /**
   * Batch validate multiple items
   */
  protected validateBatch<T>(schema: z.ZodSchema<T>, items: unknown[]): T[] {
    const results: T[] = [];
    const errors: string[] = [];
    
    items.forEach((item, index) => {
      try {
        results.push(this.validate(schema, item));
      } catch (error) {
        errors.push(`Item ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
    
    if (errors.length > 0) {
      throw new Error(`Batch validation failed:\n${errors.join('\n')}`);
    }
    
    return results;
  }

  /**
   * Sanitize user input to prevent XSS and injection attacks
   */
  protected sanitizeInput(input: string): string {
    // Remove any script tags
    let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove any event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
  }

  /**
   * Validate and sanitize query parameters
   */
  protected validateQueryParams(params: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeInput(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item =>
          typeof item === 'string' ? this.sanitizeInput(item) : item
        );
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}