---
name: test-strategy
description: Creates read-only test strategy plans for any codebase by deriving positive space, negative space, boundaries, invariants, and appropriate test shapes. Use when the user wants to plan tests, review test coverage, refactor test structure, build a test matrix, choose between example/table/property/UI styles, or define how code should be tested correctly before implementation.
---

# Test Strategy

## Purpose

This skill produces a **read-only test plan**. It does not implement tests unless the user explicitly asks outside this skill.

Use it to:
- design tests before writing them
- review existing tests for gaps
- refactor a noisy test suite into a clearer plan
- generate a **test matrix** and **table-driven skeleton**
- identify boundaries, invalid spaces, and invariants

## Workflow

1. **Identify subject under test**
   - pure logic / parser / formatter / validator / state machine / async flow / API / integration / UI / E2E
2. **Identify stack and docs**
   - inspect project test files and config
   - identify language, runner, assertion library, UI testing tools, property-testing tools
   - when tool behavior matters, load authoritative docs with the `find-docs` skill or project docs
3. **Model the behavior space**
   - positive space: expected valid behavior
   - negative space: invalid, absent, contradictory, or forbidden behavior
   - boundaries: below / at / above thresholds and transitions
   - invariants: properties that must always hold
4. **Choose test shapes**
   - single example
   - table-driven cases
   - scenario suite
   - property/invariant tests
   - user-visible UI behavior tests
5. **Emit plan artifacts**
   - test strategy summary
   - test matrix
   - table-driven skeleton
   - gaps / risks / open questions

## Required outputs

Always provide these when possible:

### 1. Test strategy summary
- subject under test
- test levels involved
- key risks
- stack/docs to confirm

### 2. Test matrix
For each behavior area, include:
- scenario / rule
- positive space
- negative space
- boundaries
- invariant if any
- recommended test shape
- priority

### 3. Table-driven skeleton
Produce pseudocode or framework-shaped skeleton matching the project stack when known.
If stack unclear, keep it language-agnostic.

### 4. Open questions
List unknowns that block high-confidence test planning.

## Canonical rules

- Test both **what must happen** and **what must not happen**.
- For thresholds and transitions, test **below / at / above**.
- Prefer **table-driven tests** when many cases share one assertion pattern.
- Prefer **property/invariant tests** when a rule should hold across ranges or many inputs.
- For UI, test **user-visible behavior**, not internal implementation details.
- For async flows, include success, failure, timeout/cancel, retry, and partial-progress states when relevant.
- When dual representations exist, test **representation independence**.

## Output style

Be concrete. Name exact cases. Keep guidance tool-agnostic, but adapt to project tooling when known.

See [REFERENCE.md](REFERENCE.md) for deeper heuristics and [EXAMPLES.md](EXAMPLES.md) for compact examples.
