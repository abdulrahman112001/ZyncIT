/**
 * Form Generic Types
 */

/**
 * Form field state
 */
export interface FormField<T = string> {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

/**
 * Generic form state
 */
export type FormState<T extends Record<string, unknown>> = {
  [K in keyof T]: FormField<T[K]>;
};

/**
 * Form validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validator function type
 */
export type Validator<T> = (value: T) => string | undefined;

/**
 * Form validators map
 */
export type FormValidators<T extends Record<string, unknown>> = {
  [K in keyof T]?: Validator<T[K]>[];
};
