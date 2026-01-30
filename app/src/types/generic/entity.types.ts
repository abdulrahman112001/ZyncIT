/**
 * Entity Generic Types
 */

/**
 * Base entity with common fields
 */
export interface BaseEntity {
  id: string;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * User-owned entity
 */
export interface UserOwnedEntity extends BaseEntity {
  userId: string;
}

/**
 * Device-specific entity
 */
export interface DeviceEntity extends UserOwnedEntity {
  deviceId: string;
  deviceName?: string;
}

/**
 * Syncable entity
 */
export interface SyncableEntity extends DeviceEntity {
  syncedAt: number;
  localOnly?: boolean;
}
