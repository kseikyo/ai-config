# Test Strategy Examples

## 1. Numeric threshold

### Input
A function converts an exact threshold to an integer percent.

### Plan
- Positive space: canonical values like 0, 30, 80, 100
- Negative space: below zero, above max, misleading alternate representations
- Boundaries: 29.49 / 29.50 / 29.51, 0.49 / 0.50 / 0.51
- Invariants: bounded 0..100, monotonic, representation-independent
- Shape: table-driven + invariant tests

### Skeleton
```text
cases:
- input: 0 -> 0
- input: 0.3 -> 30
- input: 0.8 -> 80
- input: 1.0 -> 100

boundary cases:
- below half
- at half
- above half

invariants:
- larger input never yields smaller output
- output always within bounds
```

## 2. Validator

### Input
A validator accepts 0 through 100 inclusive.

### Plan
- Positive space: 0, 1, 99, 100
- Negative space: -1, 101, NaN, empty, malformed
- Boundaries: -1 / 0 / 1 and 99 / 100 / 101
- Invariant: accepted values remain accepted regardless of unrelated fields
- Shape: table-driven

## 3. UI form submission

### Input
A form submits valid data and shows validation errors.

### Plan
- Positive space: valid submission succeeds
- Negative space: missing required field, invalid format, disabled submit, server error
- Boundaries: min/max length, exact required length
- Invariants: submit stays blocked while invalid; accessible labels remain queryable
- Shape: user-visible scenario tests

### Skeleton
```text
scenario: valid form submits
scenario: required field missing shows error and blocks submit
scenario: value at min length accepted
scenario: value below min length rejected
scenario: server error shown to user
```

## 4. Async retry flow

### Input
A request retries once after transient failure.

### Plan
- Positive space: first try succeeds; second try succeeds after transient error
- Negative space: permanent failure, timeout, cancel before retry
- Boundaries: retry count 0 / 1 / 2 if configurable
- Invariants: no duplicate side effects beyond allowed retry budget
- Shape: scenario suite
