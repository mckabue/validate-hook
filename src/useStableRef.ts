import { useLayoutEffect, useRef } from "react";

/**
 * Ref that always holds the latest value.
 *
 * Written during render so same-commit readers see the current value, and
 * re-asserted in a layout effect: a layout effect flushes before any passive
 * effect, so a child effect (which runs before its parent's) cannot read the
 * previous value, and a render that never commits cannot leave its value behind.
 */
export const useStableRef = <T>(value: T) => {
  const ref = useRef(value);
  // eslint-disable-next-line react-hooks/refs -- holding this render's value is this hook's contract
  ref.current = value;
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
};
