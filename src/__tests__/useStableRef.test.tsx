import { renderHook, act } from "@testing-library/react";
import { useStableRef } from "../useStableRef";

describe("useStableRef", () => {
  it("keeps a stable ref identity across re-renders", () => {
    const { result, rerender } = renderHook(({ value }) => useStableRef(value), {
      initialProps: { value: 1 },
    });
    const first = result.current;
    rerender({ value: 2 });
    expect(result.current).toBe(first);
  });

  it("tracks the latest value after commit", () => {
    const { result, rerender } = renderHook(({ value }) => useStableRef(value), {
      initialProps: { value: "a" },
    });
    expect(result.current.current).toBe("a");

    rerender({ value: "b" });
    act(() => {});
    expect(result.current.current).toBe("b");
  });
});
