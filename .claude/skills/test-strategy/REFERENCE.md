# Test Strategy Reference

## Core model

A good test plan maps the behavior space before writing code.

### Behavior spaces
- **Positive space**: valid inputs, expected outputs, expected visible states
- **Negative space**: invalid inputs, forbidden outputs, absence, contradictions, failures
- **Boundaries**: edges where behavior changes; test below / at / above
- **Invariants**: truths that must hold across many inputs or executions

### Common invariants
- bounded output range
- monotonicity
- idempotence
- commutativity / order independence
- conservation / totals add up
- stable sorting / determinism
- representation independence
- authorization / visibility constraints
- no duplicate side effects

## Test shapes

### Single example
Use when one case explains the rule.

### Table-driven
Use when many cases share one arrangement and one assertion shape.
Good for validators, parsers, formatters, threshold logic, permission matrices, state transitions.

### Scenario suite
Use when one scenario needs multiple assertions, setup, or stages.
Good for integration flows, retries, auth flows, UI workflows.

### Property / invariant test
Use when a truth should hold across a range, not just examples.
Good for pure deterministic logic, conversions, math, serialization, ordering, dedupe, merge logic.
Before suggesting a property test, inspect project tooling and load docs for the property-testing library if needed.

### User-visible UI test
Use when behavior matters more than implementation.
Prefer visible roles, labels, text, enabled/disabled state, focus, keyboard interaction, loading/error states.
Avoid relying on internal state, private methods, component instances, fragile selectors, or CSS classes unless the class itself is the behavior.

## Planning workflow by subject type

### Validator
Plan:
- accepted values
- rejected values
- just-inside / edge / just-outside
- null/empty/malformed
- contradictory combinations
Recommended shape: table-driven matrix

### Parser / formatter / converter
Plan:
- canonical conversions
- malformed input
- precision / rounding boundaries
- representation independence
- inverse or round-trip properties if intended
Recommended shape: examples + boundaries + invariants

### State machine / readiness logic
Plan:
- each state
- each transition
- impossible transitions
- priority rules when conditions conflict
Recommended shape: table-driven matrix or scenario suite

### Async flow
Plan:
- success path
- expected failure
- timeout
- cancellation
- retry behavior
- duplicate requests / race conditions
- partial completion / cleanup
Recommended shape: scenario suite; count assertions when async branches can be skipped silently

### API / integration
Plan:
- happy path
- malformed request / invalid params
- auth / permission failures
- empty data
- partial data
- upstream failure / retry / fallback
- contract versioning / schema drift
Recommended shape: scenario suite with small focused fixtures

### UI / component
Plan:
- initial render
- visible success state
- visible error state
- loading / pending / disabled states
- keyboard and accessibility behavior
- absence when content should not render
- state transitions after user actions
Recommended shape: user-visible scenario tests

### E2E
Plan:
- critical user journeys
- environment/setup assumptions
- network or third-party instability
- role or permission differences
- resilience / retries only where product behavior requires them
Recommended shape: scenario suite, few high-value flows

## How to choose priorities

Prioritize by:
1. business risk
2. bug likelihood at boundaries
3. irreversible side effects
4. user-visible impact
5. complexity / branching
6. frequency of use

## Output template

## Test strategy summary
- Subject:
- Risk areas:
- Test levels:
- Stack/docs to confirm:

## Test matrix
| Area | Positive space | Negative space | Boundaries | Invariant | Shape | Priority |
|---|---|---|---|---|---|---|

## Table-driven skeleton
- language/tool specific when known
- otherwise pseudocode with named case rows

## Open questions
- Unknowns
- Missing docs
- Missing domain rules

## Guidance on docs

When stack/tool behavior matters:
1. inspect repo test files, configs, and package manifests
2. identify runner, matcher, UI test library, property-test library, framework
3. fetch authoritative docs for the exact tool using `find-docs`
4. tailor skeletons to the discovered stack

Do not guess tool behavior when docs are cheap to fetch.
