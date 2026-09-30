import type { ReactNode } from 'react'
import type {
  FactoryValidateWrapperProps,
  FactoryValidationInternalProps,
  SimpleValidateWrapperProps,
  SimpleValidationInternalProps,
} from './types'
import { useValidationLogic } from './useValidationLogic'

// ============================================================================
// ValidateWrapper Component
// ============================================================================

export const ValidateWrapper = <TValue, TFactoryValue, TSchema>(
  allProps:
    | (SimpleValidateWrapperProps<TValue> &
        SimpleValidationInternalProps<TValue>)
    | (FactoryValidateWrapperProps<TValue, TSchema> &
        FactoryValidationInternalProps<TFactoryValue, TSchema>),
) => {
  const {
    setValue: setFieldValue,
    children,
    onError,
    subscribe,
    unsubscribe,
    ...props
  } = allProps

  const externalValue = 'value' in allProps ? allProps.value : undefined
  const hasValueProp = 'value' in allProps

  const { error, currentValue, canValidate, setValue } = useValidationLogic<
    TValue,
    TFactoryValue,
    TSchema
  >(
    setFieldValue,
    externalValue,
    hasValueProp,
    onError,
    subscribe,
    unsubscribe,
    props,
  )

  // Type-safe rendering based on whether value prop exists
  if (hasValueProp) {
    const childrenWithValue = children as (props: {
      error: string | undefined
      value: TValue
      setValue: (value: TValue) => void
    }) => ReactNode

    return (
      <>
        {childrenWithValue({
          error: canValidate ? error : undefined,
          value: currentValue as TValue,
          setValue,
        })}
      </>
    )
  }

  const childrenWithoutValue = children as (props: {
    error: string | undefined
    setValue: (value: TValue) => void
  }) => ReactNode

  return (
    <>
      {childrenWithoutValue({
        error: canValidate ? error : undefined,
        setValue,
      })}
    </>
  )
}
