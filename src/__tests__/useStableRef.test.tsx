import { renderHook, act, cleanup, render } from "@testing-library/react";
import { useEffect } from "react";
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

  // A child effect runs before its parent's effect, so the reader below runs
  // while the parent still has pending effects.
  it("is fresh for a child effect in the commit where the value appears", () => {
    const seen: unknown[] = [];

    const Child = ({ read }: { read: () => unknown }) => {
      useEffect(() => {
        seen.push(read());
      }, [read]);
      return null;
    };

    const Parent = ({ value }: { value?: string }) => {
      const ref = useStableRef(value);
      return value ? <Child read={() => ref.current} /> : null;
    };

    const { rerender } = render(<Parent />);
    rerender(<Parent value="v" />);
    act(() => {});
    expect(seen).toEqual(["v"]);
    cleanup();
  });
});
