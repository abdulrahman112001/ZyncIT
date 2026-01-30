/**
 * Generic Types Index
 *
 * Re-exports all generic types from separate modules
 */

// API Types
export type {
  ApiError,
  ApiResponse,
  PaginatedResponse,
  PaginationMeta,
} from './api.types';

// Store Types
export type {
  BaseState,
  ListState,
  CrudState,
  CrudActions,
  CrudStore,
} from './store.types';

// Entity Types
export type {
  BaseEntity,
  UserOwnedEntity,
  DeviceEntity,
  SyncableEntity,
} from './entity.types';

// Form Types
export type {
  FormField,
  FormState,
  ValidationResult,
  Validator,
  FormValidators,
} from './form.types';

// Event Types
export type {
  EventHandler,
  AsyncEventHandler,
  EventSubscription,
  EventEmitter,
} from './event.types';

// Utility Types
export type {
  DeepPartial,
  RequireFields,
  OptionalFields,
  KeysOfType,
  Nullable,
  Maybe,
  Result,
  AsyncResult,
  Dictionary,
  EntityMap,
  GroupedEntities,
} from './utility.types';

// Hook Types
export type {
  UseLoadingReturn,
  UseAsyncReturn,
  UsePaginationReturn,
} from './hook.types';

// Component Types
export type {
  ListProps,
  SelectableListProps,
  FormInputProps,
} from './component.types';
