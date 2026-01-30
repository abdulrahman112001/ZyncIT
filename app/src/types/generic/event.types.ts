/**
 * Event Generic Types
 */

/**
 * Generic event handler
 */
export type EventHandler<T = void> = (data: T) => void;

/**
 * Async event handler
 */
export type AsyncEventHandler<T = void, R = void> = (data: T) => Promise<R>;

/**
 * Event subscription
 */
export interface EventSubscription {
  unsubscribe: () => void;
}

/**
 * Event emitter interface
 */
export interface EventEmitter<Events extends Record<string, unknown>> {
  on<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>,
  ): EventSubscription;
  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void;
  emit<K extends keyof Events>(event: K, data: Events[K]): void;
}
