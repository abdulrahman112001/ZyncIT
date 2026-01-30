/**
 * Generic Form Validation
 *
 * Type-safe form validation utilities with generics
 */

import {
  FormState,
  FormField,
  ValidationResult,
  Validator,
  FormValidators,
} from '../types/generics';

// ============================================
// Built-in Validators (Generic)
// ============================================

export const validators = {
  /**
   * Required field validator
   */
  required: <T>(message = 'This field is required'): Validator<T> => {
    return (value: T) => {
      if (value === null || value === undefined) return message;
      if (typeof value === 'string' && value.trim() === '') return message;
      if (Array.isArray(value) && value.length === 0) return message;
      return undefined;
    };
  },

  /**
   * Minimum length validator
   */
  minLength: (min: number, message?: string): Validator<string> => {
    return (value: string) => {
      if (value && value.length < min) {
        return message || `Must be at least ${min} characters`;
      }
      return undefined;
    };
  },

  /**
   * Maximum length validator
   */
  maxLength: (max: number, message?: string): Validator<string> => {
    return (value: string) => {
      if (value && value.length > max) {
        return message || `Must be no more than ${max} characters`;
      }
      return undefined;
    };
  },

  /**
   * Email validator
   */
  email: (message = 'Invalid email address'): Validator<string> => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (value: string) => {
      if (value && !emailRegex.test(value)) {
        return message;
      }
      return undefined;
    };
  },

  /**
   * Phone number validator
   */
  phone: (message = 'Invalid phone number'): Validator<string> => {
    const phoneRegex = /^\+?[\d\s-]{8,}$/;
    return (value: string) => {
      if (value && !phoneRegex.test(value.replace(/\s/g, ''))) {
        return message;
      }
      return undefined;
    };
  },

  /**
   * Pattern validator
   */
  pattern: (regex: RegExp, message: string): Validator<string> => {
    return (value: string) => {
      if (value && !regex.test(value)) {
        return message;
      }
      return undefined;
    };
  },

  /**
   * Minimum value validator (for numbers)
   */
  min: (min: number, message?: string): Validator<number> => {
    return (value: number) => {
      if (value !== undefined && value < min) {
        return message || `Must be at least ${min}`;
      }
      return undefined;
    };
  },

  /**
   * Maximum value validator (for numbers)
   */
  max: (max: number, message?: string): Validator<number> => {
    return (value: number) => {
      if (value !== undefined && value > max) {
        return message || `Must be no more than ${max}`;
      }
      return undefined;
    };
  },

  /**
   * Match another field validator
   */
  match: <T>(
    getOtherValue: () => T,
    message = 'Fields do not match',
  ): Validator<T> => {
    return (value: T) => {
      if (value !== getOtherValue()) {
        return message;
      }
      return undefined;
    };
  },

  /**
   * Custom validator
   */
  custom: <T>(
    validateFn: (value: T) => boolean,
    message: string,
  ): Validator<T> => {
    return (value: T) => {
      if (!validateFn(value)) {
        return message;
      }
      return undefined;
    };
  },
};

// ============================================
// Arabic Validators
// ============================================

export const arabicValidators = {
  required: <T>(message = 'هذا الحقل مطلوب'): Validator<T> =>
    validators.required<T>(message),

  minLength: (min: number, message?: string): Validator<string> =>
    validators.minLength(min, message || `يجب أن يكون ${min} أحرف على الأقل`),

  maxLength: (max: number, message?: string): Validator<string> =>
    validators.maxLength(max, message || `يجب ألا يتجاوز ${max} حرف`),

  email: (message = 'بريد إلكتروني غير صالح'): Validator<string> =>
    validators.email(message),

  phone: (message = 'رقم هاتف غير صالح'): Validator<string> =>
    validators.phone(message),

  min: (min: number, message?: string): Validator<number> =>
    validators.min(min, message || `يجب أن يكون ${min} على الأقل`),

  max: (max: number, message?: string): Validator<number> =>
    validators.max(max, message || `يجب ألا يتجاوز ${max}`),

  match: <T>(
    getOtherValue: () => T,
    message = 'الحقول غير متطابقة',
  ): Validator<T> => validators.match(getOtherValue, message),
};

// ============================================
// Form Validation Functions
// ============================================

/**
 * Validate a single field with multiple validators
 */
export function validateField<T>(
  value: T,
  fieldValidators: Validator<T>[] = [],
): string | undefined {
  for (const validator of fieldValidators) {
    const error = validator(value);
    if (error) return error;
  }
  return undefined;
}

/**
 * Validate entire form
 */
export function validateForm<T extends Record<string, unknown>>(
  values: T,
  formValidators: FormValidators<T>,
): ValidationResult {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const key in formValidators) {
    const fieldValidators = formValidators[key];
    if (fieldValidators) {
      const error = validateField(
        values[key],
        fieldValidators as Validator<unknown>[],
      );
      if (error) {
        errors[key] = error;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
}

/**
 * Create initial form state from values
 */
export function createFormState<T extends Record<string, unknown>>(
  initialValues: T,
): FormState<T> {
  const state = {} as FormState<T>;

  for (const key in initialValues) {
    state[key] = {
      value: initialValues[key],
      touched: false,
      dirty: false,
    } as FormField<T[typeof key]>;
  }

  return state;
}

/**
 * Get values from form state
 */
export function getFormValues<T extends Record<string, unknown>>(
  formState: FormState<T>,
): T {
  const values = {} as T;

  for (const key in formState) {
    values[key] = formState[key].value;
  }

  return values;
}

/**
 * Check if form has errors
 */
export function hasFormErrors<T extends Record<string, unknown>>(
  formState: FormState<T>,
): boolean {
  for (const key in formState) {
    if (formState[key].error) return true;
  }
  return false;
}

/**
 * Check if form is dirty (has changed values)
 */
export function isFormDirty<T extends Record<string, unknown>>(
  formState: FormState<T>,
): boolean {
  for (const key in formState) {
    if (formState[key].dirty) return true;
  }
  return false;
}

/**
 * Check if all required fields are touched
 */
export function isFormTouched<T extends Record<string, unknown>>(
  formState: FormState<T>,
  requiredFields?: (keyof T)[],
): boolean {
  const fieldsToCheck =
    requiredFields || (Object.keys(formState) as (keyof T)[]);
  return fieldsToCheck.every(key => formState[key]?.touched);
}

// ============================================
// Form Hook Helper
// ============================================

export interface UseFormOptions<T extends Record<string, unknown>> {
  initialValues: T;
  validators?: FormValidators<T>;
  onSubmit?: (values: T) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

/**
 * Create form handlers (to be used with useReducer or useState)
 */
export function createFormHandlers<T extends Record<string, unknown>>(
  formValidators: FormValidators<T>,
) {
  return {
    handleChange: <K extends keyof T>(
      formState: FormState<T>,
      field: K,
      value: T[K],
      validateOnChange = false,
    ): FormState<T> => {
      const fieldValidators = formValidators[field];
      const error =
        validateOnChange && fieldValidators
          ? validateField(value, fieldValidators as Validator<unknown>[])
          : undefined;

      return {
        ...formState,
        [field]: {
          ...formState[field],
          value,
          dirty: true,
          error,
        },
      };
    },

    handleBlur: <K extends keyof T>(
      formState: FormState<T>,
      field: K,
      validateOnBlur = true,
    ): FormState<T> => {
      const fieldValidators = formValidators[field];
      const error =
        validateOnBlur && fieldValidators
          ? validateField(
              formState[field].value,
              fieldValidators as Validator<unknown>[],
            )
          : formState[field].error;

      return {
        ...formState,
        [field]: {
          ...formState[field],
          touched: true,
          error,
        },
      };
    },

    validate: (formState: FormState<T>): FormState<T> => {
      const values = getFormValues(formState);
      const { errors } = validateForm(values, formValidators);
      const newState = { ...formState };

      for (const key in formState) {
        newState[key] = {
          ...formState[key],
          error: errors[key],
          touched: true,
        };
      }

      return newState;
    },

    reset: (initialValues: T): FormState<T> => createFormState(initialValues),
  };
}
