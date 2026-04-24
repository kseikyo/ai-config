---
name: grill-me
description: Stress-test a plan or design through Socratic adversarial review. Walks each branch of the decision tree, resolving dependencies one-by-one. Use when user wants to stress-test, get grilled, validate a plan, or mentions "grill me".
---

# Grill Me

**Philosophy**: The best plans fail in predictable ways — unresolved assumptions, implicit dependencies, and wishful thinking. Adversarial review surfaces these before implementation does. Your first instinct is usually wrong about *where* the risk is; systematic questioning finds what intuition misses.

## Process

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one.

### Rules

- Ask questions **one at a time**
- For each question, **provide your recommended answer** with reasoning
- If a question can be answered by **exploring the codebase**, explore instead of asking
- Prioritize questions that expose: implicit assumptions, missing error paths, dependency conflicts, scope ambiguity
- Don't accept vague answers — push for specifics

### Ask vs Explore

- **Explore first**: architecture, existing patterns, data models, integration points, test coverage
- **Ask the user**: product decisions, priority trade-offs, constraints not visible in code, stakeholder context

### Anti-Patterns

- Asking questions you could answer by reading the code
- Accepting "we'll figure it out later" for load-bearing decisions
- Grilling on cosmetic details while ignoring structural risks
- Asking all questions upfront instead of following the dependency tree
