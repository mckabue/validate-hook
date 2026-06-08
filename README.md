> **📦 Migration Notice:** This package was previously published as `react-validate-hook`. If you are upgrading, simply change your imports from `react-validate-hook` to `@mckabue/react-validate`. The API is identical.

# @mckabue/react-validate

> A lightweight, flexible, and type-safe React form validation hook with zero dependencies (except React).

[![npm version](https://img.shields.io/npm/v/@mckabue/react-validate.svg)](https://www.npmjs.com/package/@mckabue/react-validate) 
[![npm downloads](https://img.shields.io/npm/dm/@mckabue/react-validate.svg)](https://www.npmjs.com/package/@mckabue/react-validate) 
[![license](https://img.shields.io/npm/l/@mckabue/react-validate.svg)](https://www.npmjs.com/package/@mckabue/react-validate)

## Why This Package?

### 🎯 Design Philosophy

In the landscape of React form validation libraries, most solutions force you into one of two extremes:

1. **Heavy frameworks** (react-hook-form, Formik) - Full form management with opinionated state control
2. **Schema-only validators** (Yup, Zod standalone) - No React integration, manual glue code required

`@mckabue/react-validate` fills the gap between these extremes with a **validation-first approach**:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Heavy Form Frameworks                              │
│  ├─ Form state management (controlled/uncontrolled)│
│  ├─ Field registration                             │
│  ├─ Validation engine ◄─── You want this          │
│  ├─ Submit handling                                │
│  └─ Reset/dirty tracking                           │
│                                                     │
└─────────────────────────────────────────────────────┘
                      vs.
┌─────────────────────────────────────────────────────┐
│                                                     │
│  @mckabue/react-validate                               │
│  └─ Validation engine only                         │
│     ├─ Render prop pattern                         │
│     ├─ Type-safe generics                          │
│     └─ Schema adapter pattern                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### ✅ When to Use This

Perfect for:
- **Custom form architectures** - You control state, this handles validation
- **Incrementally validating** existing forms - Drop in `ValidateWrapper` without refactoring
- **Multi-step wizards** - Validate individual steps independently
- **Non-form validation** - Validate any user input (search, filters, configuration)
- **Design system builders** - Provide validation as a primitive, not a framework

### ⚠️ When NOT to Use This

Consider alternatives if you need:
- **Full form state management** => Use `react-hook-form` or `Formik`
- **Complex field dependencies** => Use `Final Form` with field-level subscriptions
- **Server-side validation only** => Use `Remix` form actions or `Next.js` server actions
- **No validation at all** => Use controlled components with `useState`

---

## Installation

```bash
npm install @mckabue/react-validate
# or
yarn add @mckabue/react-validate
# or
pnpm add @mckabue/react-validate
```

**Peer Dependencies:**
- `react`: ^18.0.0

---

## Usage

### 1. Simple Validation (Inline Functions)

For straightforward validation logic without schemas:

```tsx
import { useValidator } from '@mckabue/react-validate';

function LoginForm() {
  const { ValidateWrapper, validate, errors, reset } = useValidator();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    validate();
    
    if (errors.length === 0) {
      // Submit form
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ValidateWrapper
        setValue={setEmail}
        fn={(value) => {
          if (!value) return "Email is required";
          if (!/\S+@\S+\.\S+/.test(value)) return "Invalid email format";
          return true;
        }}
      >
        {({ error, setValue }) => (
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setValue(e.target.value)}
            />
            {error && <span className="error">{error}</span>}
          </div>
        )}
      </ValidateWrapper>

      <ValidateWrapper
        setValue={setPassword}
        fn={(value) => value && value.length >= 8 ? true : "Min 8 characters"}
      >
        {({ error, setValue }) => (
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setValue(e.target.value)}
            />
            {error && <span className="error">{error}</span>}
          </div>
        )}
      </ValidateWrapper>

      <button type="submit">Login</button>
      {errors.length > 0 && (
        <div className="summary-errors">
          {errors.map((err, i) => <div key={i}>{err}</div>)}
        </div>
      )}
    </form>
  );
}
```

### 2. Factory Validation (Schema-Based)

For complex validation rules using Zod, Yup, or custom schemas:

```tsx
import { useValidator } from '@mckabue/react-validate';
import { z } from 'zod';

const emailSchema = z.string().email("Invalid email");
const passwordSchema = z.string().min(8, "Min 8 characters");

function SignupForm() {
  const { ValidateWrapper, validate, errors } = useValidator(
    (data, schema) => {
      const result = schema.safeParse(data);
      return result.success ? true : result.error.errors[0].message;
    }
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); validate(); }}>
      <ValidateWrapper setValue={setEmail} fn={emailSchema}>
        {({ error, setValue }) => (
          <input
            type="email"
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={!!error}
          />
        )}
      </ValidateWrapper>

      <ValidateWrapper setValue={setPassword} fn={passwordSchema}>
        {({ error, setValue }) => (
          <input
            type="password"
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={!!error}
          />
        )}
      </ValidateWrapper>

      <button type="submit" disabled={errors.length > 0}>
        Sign Up
      </button>
    </form>
  );
}
```

### 3. Custom Schema Adapters

Support any validation library by writing a thin adapter:

```tsx
// Yup Adapter
import * as Yup from 'yup';

const yupAdapter = (data: any, schema: Yup.AnySchema) => {
  try {
    schema.validateSync(data);
    return true;
  } catch (error) {
    return error.message;
  }
};

const { ValidateWrapper } = useValidator(yupAdapter);

// Joi Adapter
import Joi from 'joi';

const joiAdapter = (data: any, schema: Joi.Schema) => {
  const result = schema.validate(data);
  return result.error ? result.error.message : true;
};

// Custom Validator
const customAdapter = (data: any, rules: ValidationRules) => {
  // Your custom validation logic
  return rules.validate(data) ? true : rules.getError();
};
```

---

## API Reference

### `useValidator()`

Create a validator with inline validation functions.

**Returns:** `SimpleValidatorReturn`
- `ValidateWrapper` - Component wrapper for validated fields
- `validate()` - Trigger validation for all wrapped fields
- `reset()` - Clear validation state and errors
- `errors` - Array of current error messages

---

### `useValidator(validationFactory)`

Create a validator with schema-based validation.

**Parameters:**
- `validationFactory: (value, schema) => ValidationResult` - Factory function to validate values against schemas

**Returns:** `FactoryValidatorReturn<TSchema>`
- `ValidateWrapper` - Component wrapper accepting schema in `fn` prop
- `validate()` - Trigger validation
- `reset()` - Clear state
- `errors` - Current errors

---

### `ValidateWrapper` Props

#### Common Props (Both Modes)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `setValue` | `(value: T) => void` | ✅ Yes | Callback to update parent state |
| `value` | `T` | ❌ No | Optional initial/external value for validation |
| `children` | Render function | ✅ Yes | Receives `{ error, setValue }` or `{ error, value, setValue }` |

**Important:** The `children` callback signature changes based on whether `value` is provided:
- **Without `value` prop**: `({ error, setValue }) => ReactNode`
- **With `value` prop**: `({ error, value, setValue }) => ReactNode`

#### Simple Mode Additional Props

| Prop | Type | Description |
|------|------|-------------|
| `fn` | `(value) => ValidationResult` | Validation function |

#### Factory Mode Additional Props

| Prop | Type | Description |
|------|------|-------------|
| `fn` | `TSchema` | Schema object (e.g., Zod schema) |

---

## Advanced Patterns

### Multi-Step Wizards

Validate each step independently:

```tsx
function Wizard() {
  const step1Validator = useValidator();
  const step2Validator = useValidator();
  const [step, setStep] = useState(1);

  const nextStep = () => {
    if (step === 1) {
      step1Validator.validate();
      if (step1Validator.errors.length === 0) setStep(2);
    }
  };

  return (
    <>
      {step === 1 && (
        <Step1Form validator={step1Validator} onNext={nextStep} />
      )}
      {step === 2 && (
        <Step2Form validator={step2Validator} onSubmit={handleSubmit} />
      )}
    </>
  );
}
```

### Conditional Validation

Enable/disable validation based on conditions:

```tsx
function ConditionalForm() {
  const { ValidateWrapper, validate } = useValidator();
  const [isRequired, setIsRequired] = useState(false);

  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={isRequired}
          onChange={(e) => setIsRequired(e.target.checked)}
        />
        Make field required
      </label>

      <ValidateWrapper
        setValue={setFieldValue}
        fn={(value) => {
          if (!isRequired) return true;
          return value ? true : "This field is required";
        }}
      >
        {({ error, setValue }) => (
          <input onChange={(e) => setValue(e.target.value)} />
        )}
      </ValidateWrapper>
    </>
  );
}
```

### Validating Pre-Existing Values

When you have existing values (e.g., editing existing data), use the optional `value` prop to ensure validation has access to the current value from the start:

```tsx
function EditProfile() {
  const { ValidateWrapper, validate } = useValidator();
  // Existing data from API/props
  const [username, setUsername] = useState("john_doe");
  const [email, setEmail] = useState("john@example.com");

  const handleSave = () => {
    validate();
    // Validation works correctly even on initial load
  };

  return (
    <form>
      {/* WITHOUT value prop - validation only knows about setValue calls */}
      <ValidateWrapper
        fn={(value) => value && value.length >= 3 ? true : "Min 3 characters"}
        setValue={setUsername}
      >
        {({ error, setValue }) => (
          <div>
            <input 
              value={username}
              onChange={(e) => setValue(e.target.value)} 
            />
            {error && <span>{error}</span>}
          </div>
        )}
      </ValidateWrapper>

      {/* WITH value prop - validation always has current value */}
      <ValidateWrapper
        fn={(value) => value?.includes("@") ? true : "Invalid email"}
        value={email}  {/* ← Ensures validation knows initial value */}
        setValue={setEmail}
      >
        {({ error, value, setValue }) => (
          <div>
            <input 
              value={value}  {/* ← Can use value from callback */}
              onChange={(e) => setValue(e.target.value)} 
            />
            {error && <span>{error}</span>}
          </div>
        )}
      </ValidateWrapper>

      <button type="button" onClick={handleSave}>Save Changes</button>
    </form>
  );
}
```

**Type Safety:** TypeScript enforces that when you provide `value`, your children callback must accept it:

```tsx
// ✅ Correct - no value prop, callback doesn't use it
<ValidateWrapper fn={validator} setValue={setField}>
  {({ error, setValue }) => <input onChange={e => setValue(e.target.value)} />}
</ValidateWrapper>

// ✅ Correct - value prop provided, callback uses it
<ValidateWrapper fn={validator} value={field} setValue={setField}>
  {({ error, value, setValue }) => <input value={value} onChange={e => setValue(e.target.value)} />}
</ValidateWrapper>

// ❌ TypeScript Error - value prop provided but callback doesn't accept it
<ValidateWrapper fn={validator} value={field} setValue={setField}>
  {({ error, setValue }) => <input />}
</ValidateWrapper>

// ❌ TypeScript Error - no value prop but callback tries to use it
<ValidateWrapper fn={validator} setValue={setField}>
  {({ error, value, setValue }) => <input value={value} />}
</ValidateWrapper>
```

### Async Validation

Both validation functions and factory adapters support async operations:

```tsx
// Async inline validation
<ValidateWrapper
  setValue={setUsername}
  fn={async (value) => {
    if (!value) return "Required";
    
    const available = await checkUsernameAvailability(value);
    return available ? true : "Username taken";
  }}
>
  {({ error, setValue }) => (
    <input onChange={e => setValue(e.target.value)} />
  )}
</ValidateWrapper>

// Async factory validation
const asyncAdapter = async (data: any, schema: z.ZodType) => {
  await simulateNetworkDelay(100);
  const result = schema.safeParse(data);
  return result.success ? true : result.error.errors[0].message;
};

const { ValidateWrapper, validate } = useValidator(asyncAdapter);

// All validations complete before validate() resolves
await validate();
if (errors.length === 0) {
  // Safe to submit
}
```

The `validate()` function returns a Promise that resolves only after all async validations complete, making it safe to check errors immediately after.

---

## Comparison with Alternatives

| Feature | @mckabue/react-validate | react-hook-form | Formik | Final Form |
|---------|---------------------|-----------------|--------|------------|
| **Bundle Size** | ~1.2KB | ~9KB | ~13KB | ~5KB |
| **Form State** | ❌ You control | ✅ Built-in | ✅ Built-in | ✅ Built-in |
| **Validation Only** | ✅ Core focus | ❌ Coupled | ❌ Coupled | ❌ Coupled |
| **Schema Support** | ✅ Any via adapter | ✅ Zod/Yup | ✅ Yup | ⚠️ Custom |
| **Type Safety** | ✅ Full generics | ✅ Good | ⚠️ Moderate | ⚠️ Moderate |
| **Learning Curve** | Low | Moderate | Moderate | High |
| **Render Props** | ✅ Yes | ❌ Ref-based | ⚠️ Limited | ✅ Yes |

### When Each Shines

**Use @mckabue/react-validate when:**
- Building a custom form library or design system
- Need validation in non-form contexts (filters, search, config)
- Want minimal bundle impact with maximum flexibility
- Already have state management (Redux, Zustand, Context)

**Use react-hook-form when:**
- Building standard CRUD forms quickly
- Want performant uncontrolled forms
- Need battle-tested DevTools integration

**Use Formik when:**
- Migrating from class components
- Need Formik's ecosystem (plugins, integrations)
- Prefer explicit form-level state

**Use Final Form when:**
- Need fine-grained field-level subscriptions
- Complex multi-step forms with field dependencies
- Want framework-agnostic core (also works with Vue, Angular)

---

## TypeScript Support

Fully typed with generics for maximum type safety:

```tsx
// Type-safe value inference
const { ValidateWrapper } = useValidator();

<ValidateWrapper<number>  // Explicitly typed
  setValue={setAge}
  fn={(value) => {
    // `value` is `number | undefined | null`
    if (!value) return "Required";
    if (value < 18) return "Must be 18+";
    return true;
  }}
>
  {({ error, setValue }) => {
    // `setValue` accepts `number`
    return <input type="number" onChange={e => setValue(+e.target.value)} />
  }}
</ValidateWrapper>

// Type-safe schemas
const { ValidateWrapper } = useValidator((data: User, schema: z.ZodType<User>) => {
  return schema.safeParse(data).success ? true : "Invalid user";
});
```

---

## Contributing

Contributions welcome!

### Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build
npm run build
```

---

## License

MIT © [Kabui Charles]

