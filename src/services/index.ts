/**
 * Services Index - Clean Architecture Organization
 * Organized according to Clean Architecture principles and SOLID design patterns
 */

// Domain Services (Core Business Logic)
export { businessLogic } from './business/business-logic.service';
export { default as RealAssessmentService } from './realAssessmentService';

// Application Services (Use Cases and Application Logic)  
export { authService } from './auth/auth.service';
export { adminService } from './api/admin.service';
export { voiceService } from './api/voice.service';
export * from './api/community.service';

// Infrastructure Services (External Concerns)
export { unifiedAI } from './ai/unified-ai.service';
export { openaiService, openai } from './ai/openai.service';
export { anthropicService, anthropic } from './ai/anthropic.service';
export { googleAIService, googleAI } from './ai/google.service';

// Cross-Cutting Concerns
export { logger } from './logging/logger.service';
export { globalErrorHandler, handleError, handleNetworkError, handleAuthError, handleValidationError, handleBusinessError, handleCriticalError } from './error/global-error-handler.service';
export { cache } from './cache/cache.service';
export { RetryService } from './api/retry.service';

// Presentation Services (UI-related services)
export { performanceOptimizer, usePerformanceOptimization } from './performance/performance-optimizer.service';
export { mobileOptimizer, useMobileOptimization } from './mobile/mobile-optimizer.service';
export { accessibilityService, useAccessibility } from './accessibility/accessibility.service';

// Validation and Data Transfer
export * from '../types/dto';

// Base Classes and Interfaces
export { BaseApiService } from './api/base.service';
export type { ApiResponse, ApiError } from './api/base.service';

/**
 * Service Locator Pattern Implementation
 * Centralized access to all services following dependency injection principles
 */
export class ServiceLocator {
  private static services = new Map<string, any>();

  static register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  static get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found. Make sure it's registered.`);
    }
    return service;
  }

  static has(name: string): boolean {
    return this.services.has(name);
  }

  static clear(): void {
    this.services.clear();
  }

  static getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }
}

// Register core services  
try {
  ServiceLocator.register('businessLogic', businessLogic);
} catch (error) {
  console.warn('BusinessLogic service registration failed:', error);
}
ServiceLocator.register('logger', logger);
ServiceLocator.register('globalErrorHandler', globalErrorHandler);
ServiceLocator.register('cache', cache);
ServiceLocator.register('performanceOptimizer', performanceOptimizer);
ServiceLocator.register('mobileOptimizer', mobileOptimizer);
ServiceLocator.register('accessibilityService', accessibilityService);
ServiceLocator.register('unifiedAI', unifiedAI);

/**
 * Service Factory Pattern
 * Factory for creating configured service instances
 */
export class ServiceFactory {
  static createAuthenticatedService<T extends BaseApiService>(
    ServiceClass: new (tableName: string) => T,
    tableName: string,
    userId?: string
  ): T {
    const service = new ServiceClass(tableName);
    // Configure service with user context if needed
    return service;
  }

  static createCachedService<T>(
    serviceFactory: () => T,
    cacheKey: string,
    ttl: number = 3600000 // 1 hour default
  ): T {
    if (ServiceLocator.has(cacheKey)) {
      return ServiceLocator.get<T>(cacheKey);
    }

    const service = serviceFactory();
    ServiceLocator.register(cacheKey, service);
    
    // Set up cache expiration
    setTimeout(() => {
      ServiceLocator.services.delete(cacheKey);
    }, ttl);

    return service;
  }
}

/**
 * Service Health Monitor
 * Monitor the health and availability of all services
 */
export class ServiceHealthMonitor {
  private static healthChecks = new Map<string, () => Promise<boolean>>();

  static registerHealthCheck(serviceName: string, healthCheck: () => Promise<boolean>): void {
    this.healthChecks.set(serviceName, healthCheck);
  }

  static async checkAllServices(): Promise<Record<string, { healthy: boolean; latency?: number; error?: string }>> {
    const results: Record<string, { healthy: boolean; latency?: number; error?: string }> = {};

    for (const [serviceName, healthCheck] of this.healthChecks) {
      const startTime = performance.now();
      try {
        const healthy = await Promise.race([
          healthCheck(),
          new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          )
        ]);
        
        results[serviceName] = {
          healthy,
          latency: performance.now() - startTime
        };
      } catch (error) {
        results[serviceName] = {
          healthy: false,
          latency: performance.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return results;
  }

  static async checkService(serviceName: string): Promise<boolean> {
    const healthCheck = this.healthChecks.get(serviceName);
    if (!healthCheck) {
      throw new Error(`No health check registered for service: ${serviceName}`);
    }

    try {
      return await healthCheck();
    } catch (error) {
      logger.error(`Health check failed for ${serviceName}`, {
        component: 'ServiceHealthMonitor',
        action: 'checkService',
        metadata: { serviceName },
        error
      });
      return false;
    }
  }
}

// Register health checks for core services
ServiceHealthMonitor.registerHealthCheck('database', async () => {
  const { supabase } = await import('@/integrations/supabase/client');
  const { error } = await supabase.from('profiles').select('count').limit(1).single();
  return !error;
});

ServiceHealthMonitor.registerHealthCheck('ai', async () => {
  try {
    await unifiedAI.chat([{ role: 'user', content: 'health check' }], { maxTokens: 1 });
    return true;
  } catch {
    return false;
  }
});

/**
 * Dependency Injection Container
 * Simple DI container for managing service dependencies
 */
export class DIContainer {
  private static dependencies = new Map<string, any>();
  private static singletons = new Map<string, any>();

  static register<T>(token: string, factory: () => T, singleton = false): void {
    this.dependencies.set(token, { factory, singleton });
  }

  static resolve<T>(token: string): T {
    const dependency = this.dependencies.get(token);
    if (!dependency) {
      throw new Error(`Dependency '${token}' not found`);
    }

    if (dependency.singleton) {
      if (!this.singletons.has(token)) {
        this.singletons.set(token, dependency.factory());
      }
      return this.singletons.get(token);
    }

    return dependency.factory();
  }

  static clear(): void {
    this.dependencies.clear();
    this.singletons.clear();
  }
}

// Export everything for clean imports
export * from './api/assessment.service';
export * from './api/community.service';
export * from './scoring/assessmentScoring.service';
export * from './validation/schemas';