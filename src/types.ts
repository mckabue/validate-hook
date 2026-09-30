// ============================================================================
// Core Types - All other types derive from these
// ============================================================================

import { type JSX, type ReactNode } from 'react'

/**
 * Type for validation result - either true (valid) or error message string
 */
export type ValidationResult = (string | true) | Promise<string | true>

/**
 * Simple validation function that validates a value directly
 */
export type SimpleValidationFn<TValue> = (
  value: TValue | undefined | null,
) => ValidationResult

/**
 * Factory-based validation function that uses a schema/validator object
 * @template TValue - The type of value being validated
 * @template TSchema - The type of schema/validator (e.g., z.ZodType, Yup schema, etc.)
 */
export type ValidationFactory<TValue, TSchema> = (
  value: TValue,
  schema: TSchema,
) => ValidationResult

/**
 * Callback for subscription to validation state changes
 */
export type ValidationStateCallback = (
  canValidate: boolean,
) => Promise<string | true | undefined>

/**
 * Callback for reporting validation errors
 */
export type ErrorReportCallback = (key: string, message?: string) => void

// ============================================================================
// Internal Props - Used by ValidateWrapper component
// ============================================================================

/**
 * Base internal props injected into ValidateWrapper
 */
type BaseInternalProps = {
  onError: ErrorReportCallback
  subscribe: (key: string, callback: ValidationStateCallback) => void
  unsubscribe: (key: string) => void
}

/**
 * Internal props for simple validation (no factory)
 */
export type SimpleValidationInternalProps<TValue> = BaseInternalProps & {
  fn: SimpleValidationFn<TValue>
}

/**
 * Internal props for factory-based validation
 */
export type FactoryValidationInternalProps<TValue, TSchema> =
  BaseInternalProps & {
    validationFactory: ValidationFactory<TValue, TSchema>
    fn: TSchema
  }

// ============================================================================
// Public Props - Used by consumers
// ============================================================================

/**
 * Props when value is provided - children receive { error, value, setValue }
 */
type ValidateWrapperPropsWithValue<TValue> = {
  setValue: (value: TValue) => void
  value: TValue
  children: (props: {
    error: string | undefined
    value: TValue
    setValue: (value: TValue) => void
  }) => ReactNode
}

/**
 * Props when value is not provided - children receive { error, setValue }
 */
type ValidateWrapperPropsWithoutValue<TValue> = {
  setValue: (value: TValue) => void
  children: (props: {
    error: string | undefined
    setValue: (value: TValue) => void
  }) => ReactNode
}

/**
 * Props for ValidateWrapper using simple validation function (without value)
 */
type SimpleValidateWrapperPropsWithoutValue<TValue> =
  ValidateWrapperPropsWithoutValue<TValue> & {
    fn: SimpleValidationFn<TValue>
  }

/**
 * Props for ValidateWrapper using simple validation function (with value)
 */
type SimpleValidateWrapperPropsWithValue<TValue> =
  ValidateWrapperPropsWithValue<TValue> & {
    fn: SimpleValidationFn<TValue>
  }

/**
 * Union of simple validation props
 */
export type SimpleValidateWrapperProps<TValue> =
  | SimpleValidateWrapperPropsWithoutValue<TValue>
  | SimpleValidateWrapperPropsWithValue<TValue>

/**
 * Props for ValidateWrapper using factory-based validation (without value)
 */
type FactoryValidateWrapperPropsWithoutValue<TValue, TSchema> =
  ValidateWrapperPropsWithoutValue<TValue> & {
    fn: TSchema
  }

/**
 * Props for ValidateWrapper using factory-based validation (with value)
 */
type FactoryValidateWrapperPropsWithValue<TValue, TSchema> =
  ValidateWrapperPropsWithValue<TValue> & {
    fn: TSchema
  }

/**
 * Union of factory validation props
 */
export type FactoryValidateWrapperProps<TValue, TSchema> =
  | FactoryValidateWrapperPropsWithoutValue<TValue, TSchema>
  | FactoryValidateWrapperPropsWithValue<TValue, TSchema>

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * ValidateWrapper overload signatures for simple validation
 */
type SimpleValidateWrapperComponent = {
  <TValue>(props: SimpleValidateWrapperPropsWithValue<TValue>): JSX.Element
  <TValue>(props: SimpleValidateWrapperPropsWithoutValue<TValue>): JSX.Element
}

/**
 * ValidateWrapper overload signatures for factory validation
 */
type FactoryValidateWrapperComponent<TSchema> = {
  <TFieldValue>(
    props: FactoryValidateWrapperPropsWithValue<TFieldValue, TSchema>,
  ): JSX.Element
  <TFieldValue>(
    props: FactoryValidateWrapperPropsWithoutValue<TFieldValue, TSchema>,
  ): JSX.Element
}

/**
 * Return type for useValidator without factory (simple validation)
 */
export type SimpleValidatorReturn = {
  ValidateWrapper: SimpleValidateWrapperComponent
  errors: string[]
  validate: () => Promise<string[]>
  reset: () => void
}

/**
 * Return type for useValidator with factory (schema-based validation)
 */
export type FactoryValidatorReturn<TSchema> = {
  ValidateWrapper: FactoryValidateWrapperComponent<TSchema>
  errors: string[]
  validate: () => Promise<string[]>
  reset: () => void
}
