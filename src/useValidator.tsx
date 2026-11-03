import { useCallback, useMemo, useRef, useState } from 'react'
import { useStableRef } from './useStableRef'
import { ValidateWrapper } from './ValidateWrapper'
import type {
  ErrorReportCallback,
  FactoryValidateWrapperProps,
  FactoryValidationInternalProps,
  FactoryValidatorReturn,
  SimpleValidateWrapperProps,
  SimpleValidationInternalProps,
  SimpleValidatorReturn,
  ValidationFactory,
  ValidationStateCallback,
} from './types'

// ============================================================================
// useValidator Hook - Overloads & Implementation
// ============================================================================

/**
 * useValidator hook without factory - uses simple validation functions
 * @example
 * const { ValidateWrapper, validate, errors } = useValidator();
 * <ValidateWrapper fn={(value) => value ? true : "Required"} setValue={setName}>
 *   {({ error, setValue }) => <input onChange={e => setValue(e.target.value)} />}
 * </ValidateWrapper>
 */
export function useValidator(): SimpleValidatorReturn

/**
 * useValidator hook with factory - uses schema-based validation
 * @template TValue - The type of value the factory validates
 * @template TSchema - The type of schema/validator object
 * @param validationFactory - Factory function to validate values against schemas
 * @example
 * const { ValidateWrapper, validate, errors } = useValidator(
 *   (data, schema) => schema.safeParse(data).success ? true : "Invalid"
 * );
 * <ValidateWrapper fn={zodSchema} setValue={setName}>
 *   {({ error, setValue }) => <input onChange={e => setValue(e.target.value)} />}
 * </ValidateWrapper>
 */
export function useValidator<TValue, TSchema>(
  validationFactory: ValidationFactory<TValue, TSchema>,
): FactoryValidatorReturn<TSchema>

/**
 * Implementation of useValidator hook
 */
export function useValidator<TValue, TSchema>(
  validationFactory?: ValidationFactory<TValue, TSchema>,
): SimpleValidatorReturn | FactoryValidatorReturn<TSchema> {
  const [canValidate, setCanValidate] = useState<boolean>(false)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const onError = useCallback<ErrorReportCallback>((key, message) => {
    setErrors((prev) => {
      if (prev[key] === message) {
        return prev
      }
      return {
        ...prev,
        [key]: message,
      }
    })
  }, [])

  const subscriberRefs = useRef<Record<string, ValidationStateCallback>>({})

  const subscribe = useCallback(
    (key: string, callback: ValidationStateCallback) => {
      subscriberRefs.current[key] = callback
    },
    [],
  )

  const unsubscribe = useCallback((key: string) => {
    delete subscriberRefs.current[key]
  }, [])

  // A factory written inside the component is a new function on each render. If the Wrapper below
  // depended on it, each render would make a new component type, and React would remount each
  // field (its value and its focus reset). So the Wrapper calls the latest factory through a ref.
  const validationFactoryRef = useStableRef(validationFactory)
  const hasValidationFactory = validationFactory !== undefined
  const stableValidationFactory = useMemo<
    ValidationFactory<TValue, TSchema> | undefined
  >(
    () =>
      hasValidationFactory
        ? (value, schema) => validationFactoryRef.current!(value, schema)
        : undefined,
    [hasValidationFactory, validationFactoryRef],
  )

  const InnerWrapper = useMemo(() => {
    const Wrapper = <TFieldValue,>(
      props:
        | SimpleValidateWrapperProps<TFieldValue>
        | FactoryValidateWrapperProps<TFieldValue, TSchema>,
    ) => {
      const allProps = {
        subscribe,
        unsubscribe,
        onError,
        ...(stableValidationFactory && {
          validationFactory: stableValidationFactory,
        }),
        ...props,
      } as
        | (SimpleValidateWrapperProps<TFieldValue> &
            SimpleValidationInternalProps<TFieldValue>)
        | (FactoryValidateWrapperProps<TFieldValue, TSchema> &
            FactoryValidationInternalProps<TValue, TSchema>)

      return <ValidateWrapper {...allProps} />
    }
    return Wrapper
  }, [onError, subscribe, unsubscribe, stableValidationFactory])

  const flattenedErrors = useMemo(
    () =>
      canValidate ? (Object.values(errors).filter(Boolean) as string[]) : [],
    [errors, canValidate],
  )

  const validate = useCallback(async () => {
    const resultPromises = Object.values(subscriberRefs.current).map(
      (callback: ValidationStateCallback) => callback(true),
    )
    setCanValidate(true)
    const errors = (await Promise.all(resultPromises))
      .filter(
        (item: string | true | undefined): item is string =>
          typeof item === 'string',
      )
      .filter(Boolean)
    return errors
  }, [])

  const reset = useCallback(() => {
    Object.values(subscriberRefs.current).forEach(
      (callback: ValidationStateCallback) => void callback(false),
    )
    setCanValidate(false)
    setErrors({})
  }, [])

  return {
    ValidateWrapper: InnerWrapper,
    errors: flattenedErrors,
    validate,
    reset,
  }
}
