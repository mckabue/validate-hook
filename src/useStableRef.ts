import { useEffect, useRef } from "react";

/**
 * Returns a ref that always holds the latest value.
 * Lets stable callbacks read fresh props/state without being re-created
 * (or re-running effects) every time the value changes. The ref is updated
 * in an effect, not during render, to satisfy the react-hooks/refs rule.
 */
export const useStableRef = <T>(value: T) => {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
};
