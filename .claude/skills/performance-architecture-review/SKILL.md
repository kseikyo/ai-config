---
name: performance-architecture-review
description: Reviews pre-implementation software architecture for performance constraints, boundedness, data/layout fit, memory behavior, execution model, and observability. Use when the user wants to review an architecture, design, system, service, engine, pipeline, runtime, or feature for performance risks before implementation, or mentions hot paths, batching, cache behavior, memory growth, latency/throughput budgets, or mechanical sympathy.
---

# Performance Architecture Review

## Quick start

Run a read-only review of the architecture before implementation. Normalize the workload, budgets, hot paths, data models, execution model, memory model, concurrency model, boundedness model, observability model, and failure model. Apply deterministic checks and required stress tests. Return findings, required revisions, and a verdict.

## Hard boundary

Preserve this distinction:
- Specification analysis checks wording, consistency, and coverage.
- Plan Walkthrough checks whether a plan executes cleanly in sequence.
- Performance Architecture Review checks whether the architecture itself is aligned with workload, resource limits, and machine realities.

Mandatory rules:
1. Do not implement.
2. Do not mutate artifacts as part of the review.
3. Do not silently redesign the architecture.
4. Recommend only the revisions needed before implementation.
5. Stay read-only and pre-implementation.

## When to use it

Use when:
- the system is performance-sensitive
- the design introduces hot paths, batching, caching, concurrency, or large data movement
- the user wants to validate latency, throughput, memory, or boundedness assumptions early
- the work involves engines, services, pipelines, databases, runtimes, simulations, or distributed systems

## When not to use it

Do not use it when:
- the task is small and obviously non-critical
- the issue is local implementation tuning rather than architecture
- the next step is profiling already-built code
- the concern is mainly wording or plan sequencing

## Review objects

Normalize the design into these review objects:
- workload model
- budgets
- resource model
- hot paths
- data models
- execution model
- memory model
- concurrency model
- boundedness model
- observability model
- failure/degradation model
- decisions and gates, if present

## Standard workflow

1. Establish the read-only pre-implementation review boundary.
2. Load the architecture artifact and only the companion context needed to understand performance behavior.
3. Normalize the review objects.
4. Run deterministic checks.
5. Apply every mandatory stress-test category.
6. Review the normalized objects for structural performance risk.
7. Synthesize anchored findings.
8. Produce ordered required revisions.
9. Issue a verdict: `ready`, `ready_with_revisions`, or `not_ready`.
10. End with an honesty section describing what the review validates and does not validate.

## Output expectations

Return:
- deterministic validation results
- object-level review notes
- stress-test results
- findings anchored to specific objects
- required revisions
- verdict

## Canonical invocation phrasing

Use this prompt pattern:

> Run a Performance Architecture Review on this design. Normalize the workload, budgets, hot paths, data models, execution model, memory model, concurrency model, boundedness model, observability model, and failure model. Apply deterministic checks and required stress tests. Identify structural performance risks, hidden unboundedness, incorrect bottleneck assumptions, and places where the architecture would force expensive behavior by design. Recommend only the revisions needed before implementation, and stay strictly read-only.

## Advanced reference

See [REFERENCE.md](REFERENCE.md) for the canonical schema, deterministic checks, stress tests, output structure, verdict semantics, and worked example.
