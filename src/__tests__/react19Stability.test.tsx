/**
 * React 19 migration guards for useValidator.
 *
 * These tests pin the behavior the upgrade relies on: ValidateWrapper must stay
 * referentially stable across parent re-renders (no subtree remounts), and
 * typing must settle without runaway/infinite re-renders. A regression here
 * would show up as a performance cliff or a "Maximum update depth exceeded"
 * crash in React 19.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { useValidator } from "../useValidator";
import * as z from "zod";

const factory = (data: unknown, schema: z.ZodType): string | true => {
  const result = schema.safeParse(data ?? {});
  return result.success
    ? true
    : (result.error.issues?.[0]?.message ?? "Validation failed");
};

describe("useValidator React 19 stability guards", () => {
  it("keeps ValidateWrapper referentially stable across parent re-renders", () => {
    let firstIdentity: unknown;
    let childRenders = 0;

    const Child = () => {
      childRenders += 1;
      return <span data-testid="child">child</span>;
    };

    const Parent = () => {
      const { ValidateWrapper } = useValidator(factory);
      const [tick, setTick] = useState(0);

      if (firstIdentity === undefined) {
        firstIdentity = ValidateWrapper;
      }
      else {
        expect(ValidateWrapper).toBe(firstIdentity);
      }

      return (
        <div>
          <ValidateWrapper fn={z.string().min(3)} setValue={() => {}}>
            {() => <Child />}
          </ValidateWrapper>
          <button data-testid="rerender" onClick={() => setTick((t) => t + 1)}>
            rerender {tick}
          </button>
        </div>
      );
    };

    render(<Parent />);
    const button = screen.getByTestId("rerender");
    for (let i = 0; i < 10; i += 1) {
      fireEvent.click(button);
    }

    // Identity never changed; the subtree was never remounted.
    expect(childRenders).toBeLessThanOrEqual(12);
  });

  it("preserves child state across parent re-renders (no remount)", () => {
    const Parent = () => {
      const { ValidateWrapper } = useValidator(factory);
      const [tick, setTick] = useState(0);

      return (
        <div>
          <ValidateWrapper fn={z.string().min(3)} setValue={() => {}}>
            {({ error }) => (
              <FieldWithState error={error} />
            )}
          </ValidateWrapper>
          <button data-testid="rerender" onClick={() => setTick((t) => t + 1)}>
            rerender {tick}
          </button>
        </div>
      );
    };

    const FieldWithState = ({ error }: { error: string | undefined }) => {
      const [value, setValue] = useState("keep-me");
      return (
        <div>
          <input
            data-testid="input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <span data-testid="error">{error ?? "no-error"}</span>
        </div>
      );
    };

    render(<Parent />);
    const input = screen.getByTestId("input");
    fireEvent.change(input, { target: { value: "edited" } });
    expect(input.value).toBe("edited");

    // Parent re-renders 10x; the child's local state must survive (would reset
    // to "keep-me" if ValidateWrapper identity changed and remounted it).
    const button = screen.getByTestId("rerender");
    for (let i = 0; i < 10; i += 1) {
      fireEvent.click(button);
    }

    expect(input.value).toBe("edited");
  });

  it("does not cascade into infinite re-renders in a controlled value flow", () => {
    let parentRenders = 0;

    const Parent = () => {
      parentRenders += 1;
      const { ValidateWrapper } = useValidator(factory);
      const [value, setValue] = useState("");

      return (
        <ValidateWrapper fn={z.string().min(3)} value={value} setValue={setValue}>
          {({ error, value: v, setValue: sv }) => (
            <div>
              <input
                data-testid="input"
                value={v}
                onChange={(e) => sv(e.target.value)}
              />
              <span data-testid="error">{error ?? "no-error"}</span>
            </div>
          )}
        </ValidateWrapper>
      );
    };

    render(<Parent />);
    const input = screen.getByTestId("input");

    const before = parentRenders;
    fireEvent.change(input, { target: { value: "abc" } });

    // One keystroke must settle within a bounded number of renders. An
    // unbounded count means the value-sync effect is looping (externalValue
    // instability), which would crash React 19 with "Maximum update depth".
    expect(parentRenders - before).toBeLessThanOrEqual(4);
  });
});
