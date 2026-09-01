import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useStableRef } from "./useStableRef";
import type {
  ErrorReportCallback,
  SimpleValidationFn,
  ValidationFactory,
  ValidationResult,
  ValidationStateCallback,
} from "./types";

const useStateWithRef = <T>(initialValue: T) => {
  const [state, _setState] = useState<T>(initialValue);
  const stateRef = useRef<T>(initialValue);
  const setState = useCallback((value: T) => {
    stateRef.current = value;
    _setState(value);
  }, []);

  return [state, setState, stateRef] as const;
};

// Core validation logic hook
export const useValidationLogic = <TValue, TFactoryValue, TSchema>(
  setFieldValue: (value: TValue) => void,
  externalValue: TValue | undefined,
  hasValueProp: boolean,
  onError: ErrorReportCallback,
  subscribe: (key: string, callback: ValidationStateCallback) => void,
  unsubscribe: (key: string) => void,
  props:
    | { fn: SimpleValidationFn<TValue> }
    | {
        validationFactory: ValidationFactory<TFactoryValue, TSchema>;
        fn: TSchema;
      },
) => {
  const [error, setError] = useState<string | undefined>(undefined);
  const [currentValue, setCurrentValue, currentValueRef] = useStateWithRef<
    TValue | undefined
  >(externalValue);
  const [canValidate, setCanValidate, canValidateRef] =
    useStateWithRef<boolean>(false);
  const id = useId();

  // Latest-value refs: validate()/setValue always see the freshest props
  // without recreating callbacks (avoids unnecessary rerenders)
  const propsRef = useStableRef(props);
  const setFieldValueRef = useStableRef(setFieldValue);

  const validate = async () => {
    if (canValidateRef.current) {
      // Use propsRef.current to always access the latest validation logic
      const result: ValidationResult =
        "validationFactory" in propsRef.current
          ? await propsRef.current.validationFactory(
              currentValueRef.current as TFactoryValue,
              propsRef.current.fn,
            )
          : await propsRef.current.fn(currentValueRef.current);

      if (result === true) {
        setError(undefined);
        onError(id, undefined);
      } else {
        setError(result);
        onError(id, result);
      }

      return result;
    } else {
      setError(undefined);
      onError(id, undefined);
    }
  };

  const setValue = useCallback(
    (newValue: TValue) => {
      setFieldValueRef.current(newValue);
      setCurrentValue(newValue);
      void validate();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setCurrentValue],
  );

  // Sync internal value with external value prop
  // Use setCurrentValue (not setValue) to avoid calling setFieldValue back to parent
  // which would cause infinite loops
  // Only sync when value prop is explicitly provided (hasValueProp)
  useEffect(() => {
    if (hasValueProp) {
      setCurrentValue(externalValue);
      void validate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasValueProp, externalValue, setCurrentValue]);

  useEffect(() => {
    subscribe(id, (_canValidate: boolean) => {
      setCanValidate(_canValidate);
      return validate();
    });

    return () => {
      unsubscribe(id);
    };
    /**
     * This should only fire when id, subscribe, unsubscribe changes.
     * This functions is mostly intended to subscribe and unsubscribe.
     *
     * Current value changing should not fire this, it has its own useEffect!
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, subscribe, unsubscribe]);

  return { error, currentValue, canValidate, setValue };
};
