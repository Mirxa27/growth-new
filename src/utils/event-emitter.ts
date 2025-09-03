/**
 * Browser-compatible EventEmitter implementation
 * Based on Node.js EventEmitter API
 */

export type EventListener = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string | symbol, EventListener[]> = new Map();
  private maxListeners: number = 10;

  constructor() {}

  /**
   * Add a listener for the specified event
   */
  on(event: string | symbol, listener: EventListener): this {
    return this.addListener(event, listener);
  }

  /**
   * Add a listener for the specified event
   */
  addListener(event: string | symbol, listener: EventListener): this {
    if (typeof listener !== 'function') {
      throw new TypeError('The listener must be a function');
    }

    const listeners = this.events.get(event) || [];
    listeners.push(listener);
    this.events.set(event, listeners);

    // Check for max listeners
    if (listeners.length > this.maxListeners && this.maxListeners !== 0) {
      console.warn(
        `MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ` +
        `${listeners.length} ${String(event)} listeners added. ` +
        `Use emitter.setMaxListeners() to increase limit`
      );
    }

    return this;
  }

  /**
   * Add a one-time listener for the specified event
   */
  once(event: string | symbol, listener: EventListener): this {
    const onceWrapper = (...args: any[]) => {
      this.removeListener(event, onceWrapper);
      listener.apply(this, args);
    };
    
    // Preserve the original listener for removeListener
    (onceWrapper as any).listener = listener;
    
    return this.on(event, onceWrapper);
  }

  /**
   * Remove a listener from the specified event
   */
  removeListener(event: string | symbol, listener: EventListener): this {
    const listeners = this.events.get(event);
    
    if (!listeners) return this;

    const index = listeners.findIndex(l => 
      l === listener || (l as any).listener === listener
    );
    
    if (index !== -1) {
      listeners.splice(index, 1);
      if (listeners.length === 0) {
        this.events.delete(event);
      } else {
        this.events.set(event, listeners);
      }
    }

    return this;
  }

  /**
   * Alias for removeListener
   */
  off(event: string | symbol, listener: EventListener): this {
    return this.removeListener(event, listener);
  }

  /**
   * Remove all listeners for the specified event
   */
  removeAllListeners(event?: string | symbol): this {
    if (event === undefined) {
      this.events.clear();
    } else {
      this.events.delete(event);
    }
    return this;
  }

  /**
   * Emit an event with the given arguments
   */
  emit(event: string | symbol, ...args: any[]): boolean {
    const listeners = this.events.get(event);
    
    if (!listeners || listeners.length === 0) {
      return false;
    }

    // Create a copy to avoid issues if listeners modify the array
    const listenersCopy = [...listeners];
    
    for (const listener of listenersCopy) {
      try {
        listener.apply(this, args);
      } catch (error) {
        console.error(`Error in event listener for '${String(event)}':`, error);
      }
    }

    return true;
  }

  /**
   * Get the number of listeners for a specific event
   */
  listenerCount(event: string | symbol): number {
    const listeners = this.events.get(event);
    return listeners ? listeners.length : 0;
  }

  /**
   * Get all listeners for a specific event
   */
  listeners(event: string | symbol): EventListener[] {
    const listeners = this.events.get(event);
    return listeners ? [...listeners] : [];
  }

  /**
   * Get all event names
   */
  eventNames(): (string | symbol)[] {
    return Array.from(this.events.keys());
  }

  /**
   * Set the maximum number of listeners
   */
  setMaxListeners(n: number): this {
    this.maxListeners = n;
    return this;
  }

  /**
   * Get the maximum number of listeners
   */
  getMaxListeners(): number {
    return this.maxListeners;
  }
}