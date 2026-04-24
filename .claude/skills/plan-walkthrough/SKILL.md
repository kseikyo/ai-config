---
name: plan-walkthrough
description: >-
  Run a read-only walkthrough of a materially formed implementation plan in
  execution order before implementation begins. Use when the user wants to
  rehearse execution, validate sequencing, handoffs, gates, pilot logic, or
  likely improvisation points without implementing. Distinct from specification
  analysis: specification analysis walks the artifact; plan walkthrough walks
  the execution.
---

# Plan Walkthrough

Plan Walkthrough is a **read-only pre-implementation walkthrough of a plan in execution order**.

Its purpose is to answer:

> If we execute this plan as written, step by step, where will execution become unclear, unsafe, drift-prone, or forced into improvisation?

## Hard boundary

Preserve this distinction:

- **Specification analysis walks the artifact**: wording, coverage, consistency, alignment
- **Plan Walkthrough walks the execution**: sequence, inputs, handoffs, gates, pilot logic, and forced improvisation

If a finding is resolved by rereading the document for consistency or wording, it belongs to specification analysis.
If a finding appears only when you simulate carrying the plan out in order, it belongs here.

## Read-only invariants

These rules are mandatory:

1. Do not implement.
2. Do not mutate artifacts as part of the walkthrough.
3. Do not silently redesign the plan.
4. Recommend revisions only when needed.
5. Keep deterministic scaffold separate from judgment.
6. Anchor every substantive finding to a step, handoff, decision, gate, or stress test.
7. State clearly what the walkthrough validates and what it does not validate.

For v1, a **substantive finding** is any finding that could change the verdict, require a revision, block execution, or materially change how a step, handoff, decision, gate, or stress test must be understood.

## Why this skill exists

Some plans are document-coherent but operationally fragile.

A plan may pass ordinary review and still fail in practice because:
- the execution order is underdefined
- a step depends on an unstated input
- a decision is required but not frozen
- a handoff is ambiguous
- a pilot does not test the risky part
- scale-up changes semantics
- the executor would have to improvise midstream

This skill exists to surface those issues before implementation begins.

## When to use it

Use this skill when a plan:
- spans multiple phases or meaningful handoffs
- introduces a schema, registry, or source-of-truth artifact
- includes manual review, governance, provenance, or merge rules
- uses pilot → scale sequencing
- feels strong as a document but uncertain as a workflow
- is likely to drift during execution if not rehearsed first

## When not to use it

Do not use this skill when:
- the task is small and local
- execution is trivial and linear
- there is no meaningful sequencing or handoff risk
- the issue is primarily wording, consistency, or task/spec coverage
- a live dry run or implementation is the actual next step

## Relationship to adjacent practices

### Versus specification analysis
- specification analysis checks the artifact
- Plan Walkthrough checks the execution reality of carrying it out

### Versus architecture review
- architecture review checks the technical approach
- Plan Walkthrough checks whether the approach can be executed cleanly in sequence

### Versus pre-mortem
- pre-mortem imagines why failure might happen
- Plan Walkthrough finds the exact step where execution would force ambiguity, drift, or improvisation

### Versus dry run
- a dry run may exercise a real or staging system
- Plan Walkthrough stays read-only and does not execute the plan

## Inputs expected

This skill accepts either:
1. a materially complete plan artifact in prose, or
2. a pre-normalized walkthrough input object matching the schema below.

If the user provides prose only, first normalize it into the review objects before judging it.

Optional companion inputs:
- pilot scope
- explicit gates
- schema or source-of-truth rules
- related specs or architecture notes
- provenance / merge / governance rules

## Canonical input schema

This is the **single canonical input schema** for v1. The skill may derive it from prose when the user has not pre-structured the plan.

### Top level
- `walkthroughId: string` — recommended format `PW-YYYY-MM-DD-NNN`
- `walkthroughVersion: integer`
- `previousWalkthroughId?: string`
- `plan: object`
- `reviewBoundary: object`
- `steps: Step[]`
- `handoffs: Handoff[]`
- `decisions: Decision[]`
- `gates: Gate[]`
- `stressTestCatalog: StressTest[]`
- `deterministicCheckCatalog: DeterministicCheck[]`
- `limits: Limits`

### `plan`
- `planId: string`
- `title: string`
- `primaryArtifact: string`
- `companionArtifacts?: string[]`
- `scope: string`
- `summary?: string`
- `hasPilot: boolean`
- `hasScaleUp: boolean`
- `hasExplicitGates: boolean`
- `hasSchemaOrSourceOfTruth: boolean`
- `hasGovernanceRules: boolean`

### `reviewBoundary`
- `preImplementation: true`
- `readOnly: true`
- `noSilentRedesign: true`
- `noImplementation: true`
- `noLiveExecution: true`
- `reviewGoal: string`

### `Step`
- `stepId: string` — `STEP-NNN`
- `phase?: string`
- `sequence: integer`
- `label: string`
- `description: string`
- `actionType: enum(decision | artifact_creation | artifact_review | manual_review | validation | merge | gate | rollout | other)`
- `inputs: string[]`
- `outputs: string[]`
- `dependsOnStepIds?: string[]`
- `handoffIds?: string[]`
- `gateIds?: string[]`
- `notes?: string[]`

### `Handoff`
- `handoffId: string` — `HANDOFF-NNN`
- `fromStepId: string`
- `toStepId: string`
- `artifactRefs?: string[]`
- `decisionRefs?: string[]`
- `completionSignal: string`
- `notes?: string[]`

### `Decision`
- `decisionId: string` — `DECISION-NNN`
- `label: string`
- `description: string`
- `status: enum(frozen | required_unfrozen | unknown)`
- `owner?: string`
- `appliesToStepIds: string[]`
- `source: enum(plan | companion_artifact | reviewer_inferred)`

### `Gate`
- `gateId: string` — `GATE-NNN`
- `label: string`
- `appliesAfterStepId: string`
- `criteria: string[]`
- `failureOutcome: string`
- `notes?: string[]`

### `StressTest`
- `stressTestId: string` — `TEST-NNN`
- `type: enum(missing_prerequisite | ambiguous_ownership | hidden_subjective_decision | sequencing_inversion | artifact_contract_gap | pilot_not_testing_true_risk | scale_up_semantic_drift | identity_rename_delete_merge | gate_without_criteria | rollback_or_abort_unclear)`
- `required: boolean`

### `DeterministicCheck`
- `checkId: string` — `CHECK-NNN`
- `type: enum(primary_artifact_exists | all_steps_have_unique_ids | all_steps_have_sequence | all_steps_have_labels | all_steps_have_inputs | all_steps_have_outputs | all_handoffs_reference_known_steps | all_gates_reference_known_steps | all_decisions_reference_known_steps | required_stress_tests_present | review_boundary_is_read_only)`
- `required: boolean`

### `Limits`
- `validatedByWalkthrough: string[]`
- `notValidatedByWalkthrough: string[]`

### ID rules
- IDs must be unique **per walkthrough run**
- counters reset **per walkthrough run** and increment independently **per object type**

## Review objects

The primary review objects are:
- **steps**
- **handoffs**
- **decisions**
- **gates**

Applied catalogs:
- **stress tests**
- **deterministic checks**

If the plan is not already structured this way, normalize it into these objects before issuing findings.

## Deterministic scaffold

The deterministic scaffold is the fixed protocol and schema used to run the walkthrough consistently.

### Protocol stages
1. Load the plan and any needed companion context.
2. Confirm the review boundary is pre-implementation and read-only.
3. Normalize execution objects: steps, handoffs, decisions, gates.
4. Assign stepped IDs if they are missing.
5. Run binary deterministic checks.
6. Require all mandatory stress-test categories to appear as either evaluated or `not_applicable` with a reason.
7. Review normalized objects.
8. Emit a structured report with verdict, required revisions, and limits.

### Mandatory binary deterministic checks
Run these as binary checks in v1:
- primary artifact exists
- all steps have unique IDs
- all steps have sequence numbers
- all steps have labels
- all steps have inputs
- all steps have outputs
- all handoffs reference known steps
- all gates reference known steps
- all decisions reference known steps
- required stress tests are present
- review boundary is read-only

`review boundary is read-only` is a field-equality check against the review-boundary contract, not a semantic interpretation pass.

### Mandatory stress-test categories
Every walkthrough must represent these categories as either evaluated or `not_applicable` with a reason:
- missing prerequisite
- ambiguous ownership
- hidden subjective decision
- sequencing inversion
- artifact contract gap
- pilot not testing true risk
- scale-up semantic drift
- identity / rename / delete / merge
- gate without criteria
- rollback or abort unclear

### Processing stance
- **Serial:** normalization
- **Optional parallelism:** object-level review of steps / handoffs / decisions / gates
- **Serial:** finding synthesis, revision ordering, and final verdict

## Judgment layer

The judgment layer interprets the normalized plan using the deterministic scaffold.

### Evaluation dimensions
- **execution realism**: whether the written sequence is actually workable in practice
- **improvisation risk**: whether execution would force unplanned subjective decisions
- **pilot adequacy**: whether any pilot tests the real risk rather than a convenient subset
- **drift risk**: whether meaning, scope, or governance is likely to change between reviewed plan and execution
- **revision minimality**: whether a proposed fix clarifies execution without redesigning the plan

### Review questions by object type

#### Step
- What is done here?
- What must already exist?
- What decisions must already be frozen?
- What is produced?
- What would go wrong if executed exactly as written?
- Where would execution require improvisation?

#### Handoff
- What is being passed forward?
- In what form?
- Is the completion signal explicit?
- Is there a hidden ownership or timing gap?
- Would the receiving step know what it is allowed to assume?

#### Decision
- Is the decision explicit?
- Is it frozen when needed?
- Is ownership clear?
- Which steps depend on it?
- What happens if execution reaches the dependent step before the decision is frozen?

#### Gate
- Are the criteria present?
- Are they operationally clear?
- Do they test the real risk?
- What happens on fail?
- Does the gate prevent drift, or only create paperwork?

### Finding discipline
- Anchor every substantive finding to a step, handoff, decision, gate, or stress test
- Prefer concrete failure cases over generic advice
- Treat low-signal wording tweaks as notes, not findings
- Prioritize findings that could block execution, force improvisation, invalidate a pilot, or create drift

## Canonical output schema

This is the **single canonical output schema** for v1.

### Top level
- `walkthroughId: string`
- `walkthroughVersion: integer`
- `inputWalkthroughId?: string`
- `deterministicValidation: object`
- `stepReviews: StepReview[]`
- `handoffReviews: HandoffReview[]`
- `decisionReviews: DecisionReview[]`
- `gateReviews: GateReview[]`
- `stressTestResults: StressTestResult[]`
- `findings: Finding[]`
- `requiredRevisions: Revision[]`
- `verdict: Verdict`
- `limits: Limits`

### `deterministicValidation`
- `results: DeterministicResult[]`
- `allRequiredChecksPassed: boolean`

#### `DeterministicResult`
- `checkId: string`
- `type: string`
- `passed: boolean`
- `notes?: string[]`

### `StepReview`
- `stepReviewId: string` — `STEPREVIEW-NNN`
- `stepId: string`
- `expectedAction: string`
- `requiredInputsConfirmed: boolean`
- `expectedOutputsConfirmed: boolean`
- `hiddenDecisionPresent: boolean`
- `improvisationRiskPresent: boolean`
- `notes?: string[]`
- `findingIds?: string[]`

### `HandoffReview`
- `handoffReviewId: string` — `HANDOFFREVIEW-NNN`
- `handoffId: string`
- `artifactTransferClear: boolean`
- `decisionTransferClear: boolean`
- `completionSignalClear: boolean`
- `notes?: string[]`
- `findingIds?: string[]`

### `DecisionReview`
- `decisionReviewId: string` — `DECISIONREVIEW-NNN`
- `decisionId: string`
- `isExplicit: boolean`
- `isFrozenWhenNeeded: boolean`
- `ownerClear: boolean`
- `dependencyCoverageClear: boolean`
- `notes?: string[]`
- `findingIds?: string[]`

### `GateReview`
- `gateReviewId: string` — `GATEREVIEW-NNN`
- `gateId: string`
- `criteriaPresent: boolean`
- `criteriaOperationallyClear: boolean`
- `failureOutcomeClear: boolean`
- `testsRealRisk: boolean`
- `notes?: string[]`
- `findingIds?: string[]`

### `StressTestResult`
- `stressTestResultId: string` — `TESTRESULT-NNN`
- `stressTestId: string`
- `type: string`
- `status: enum(passed | issue_found | not_applicable)`
- `reason?: string`
- `affectedObjectIds?: string[]`
- `notes?: string[]`
- `findingIds?: string[]`

### `Finding`
- `findingId: string` — `FINDING-NNN`
- `anchorType: enum(step | handoff | decision | gate | stress_test)`
- `anchorId: string`
- `title: string`
- `summary: string`
- `whyItMatters: string`
- `requiredRevision: string`
- `blocking: boolean`
- `severity?: enum(low | medium | high | blocking)`
- `deterministic?: boolean`

### `Revision`
- `revisionId: string` — `REVISION-NNN`
- `priority: integer`
- `relatedFindingIds: string[]`
- `instruction: string`
- `kind: enum(plan_clarification | input_definition | handoff_definition | decision_freeze | gate_definition | edge_case_rule | pilot_scope_revision | other)`
- `mustBeResolvedBeforeExecution: boolean`

### `Verdict`
- `status: enum(ready | ready_with_revisions | not_ready)`
- `summary: string`
- `blockingFindingIds?: string[]`
- `readyCondition?: string`

## Verdict semantics and loop behavior

Use exactly these verdicts:

### `ready`
Use when the walkthrough was meaningful, required deterministic checks passed after normalization, and no unresolved substantive finding requires revision before execution.

### `ready_with_revisions`
Use when the walkthrough was meaningful, but substantive findings require plan revisions before execution. Stop, return revisions, and rerun only after revisions are applied.

### `not_ready`
Use when the plan is too incomplete, unstable, or under-specified for a meaningful walkthrough after normalization. Stop and redirect to planning or specification improvement before rerunning.

### Loop behavior
- `ready`: stop
- `ready_with_revisions`: stop; revisions happen outside the walkthrough; rerun after revision
- `not_ready`: stop; improve planning/specification first, then rerun

The walkthrough does not author spec fixes. It identifies them.

## Standard workflow

1. Establish the read-only review boundary.
2. Identify the primary plan artifact and only the companion artifacts needed to understand execution.
3. Normalize the execution path into steps, handoffs, decisions, and gates.
4. Apply binary deterministic checks.
5. Apply every mandatory stress-test category as evaluated or `not_applicable` with reason.
6. Review steps, handoffs, decisions, and gates.
7. Synthesize anchored findings.
8. Produce ordered required revisions.
9. Issue the verdict.
10. End with an honesty section: what this walkthrough validates and what it does not validate.

## Worked example

### Mini input situation
A plan says: define a pilot, seed a registry, review the seeded records, then decide whether to scale up. It mentions a pilot gate but does not define the pilot selection rule or gate criteria.

### Example objects
- `STEP-001`: Freeze pilot scope
- `STEP-002`: Seed pilot registry
- `HANDOFF-001`: hand off frozen pilot scope from `STEP-001` to `STEP-002`
- `DECISION-001`: Pilot inclusion criteria
- `GATE-001`: Pilot readiness gate
- `TEST-001`: `pilot_not_testing_true_risk`
- `CHECK-001`: `all_steps_have_inputs`

### Example walkthrough result
- `CHECK-001`: **failed** because `STEP-002` depends on pilot scope, but the input is unstated in the written plan prior to normalization
- `DECISION-001`: explicit in concept, but not frozen when needed
- `HANDOFF-001`: decision transfer is unclear
- `GATE-001`: criteria missing, so the gate does not test real risk
- `TEST-001`: `issue_found` because the pilot could succeed mechanically while still avoiding the actual risky semantics

### Example finding
- **Anchor**: `DECISION-001`
- **Summary**: Pilot inclusion criteria are required before seeding but are not frozen.
- **Why it matters**: The executor would choose pilot members ad hoc, distorting what the pilot validates.
- **Required revision**: Add an explicit pre-seeding step that defines and freezes pilot inclusion criteria.

### Example verdict
`ready_with_revisions`

## Trigger guidance

Use this skill when the user asks to:
- walk a plan before execution
- rehearse execution without implementing
- validate sequencing, handoffs, gates, or prerequisites
- stress-test a pilot-first or rollout plan
- check whether a plan will force improvisation in practice
- review a schema-bearing or source-of-truth plan operationally before implementation

## Non-goals

This skill does not:
- replace specification analysis
- replace architecture review
- replace a live dry run
- guarantee implementation success
- validate code-level correctness
- validate runtime correctness
- approve vague plans through confident language
- implement the revisions it recommends

## Honesty / limits

A Plan Walkthrough can validate:
- execution-path clarity
- whether key inputs, decisions, handoffs, and gates are visible enough to execute
- where execution would likely force improvisation
- whether pilot and scale-up logic look operationally stable

A Plan Walkthrough does **not** validate:
- code correctness
- runtime correctness
- performance
- production safety under live execution
- whether the architecture is good in the first place

## Canonical invocation phrasing

Use this prompt pattern:

> Run a Plan Walkthrough on this plan. Walk it in execution order, normalize the execution objects, apply the required deterministic checks and stress tests, identify where implementation would require hidden decisions or improvisation, recommend only the revisions needed before execution, and stay strictly read-only.
