# Performance Architecture Review Reference

## What this review validates

A Performance Architecture Review can validate:
- workload clarity
- whether key budgets and hot paths are visible enough to review
- whether the architecture appears bounded and mechanically sympathetic
- whether data layout, execution model, memory policy, and observability are explicit enough to implement responsibly
- where the design would likely force expensive behavior by structure

A Performance Architecture Review does **not** validate:
- code correctness
- runtime correctness
- benchmark results
- production safety under live execution
- whether the architecture is globally optimal

## Canonical input schema

This skill accepts either:
1. a materially complete architecture/design artifact in prose, or
2. a pre-normalized review object matching the schema below.

### Top level
- `reviewId: string`
- `reviewVersion: integer`
- `previousReviewId?: string`
- `architecture: object`
- `reviewBoundary: object`
- `workload: WorkloadModel`
- `budgets: Budget[]`
- `resources: ResourceModel[]`
- `hotPaths: HotPath[]`
- `dataModels: DataModel[]`
- `executionModel: ExecutionModel`
- `memoryModel: MemoryModel`
- `concurrencyModel: ConcurrencyModel`
- `boundednessModel: BoundednessModel`
- `observabilityModel: ObservabilityModel`
- `failureModel: FailureModel`
- `decisions?: Decision[]`
- `gates?: Gate[]`
- `stressTestCatalog: StressTest[]`
- `deterministicCheckCatalog: DeterministicCheck[]`
- `limits: Limits`

### `architecture`
- `architectureId: string`
- `title: string`
- `primaryArtifact: string`
- `companionArtifacts?: string[]`
- `scope: string`
- `summary?: string`
- `systemType: enum(service | engine | simulation | database | pipeline | runtime | distributed_system | other)`
- `performanceSensitivity: enum(low | medium | high | critical)`

### `reviewBoundary`
- `preImplementation: true`
- `readOnly: true`
- `noSilentRedesign: true`
- `noImplementation: true`
- `noLiveExecution: true`
- `reviewGoal: string`

### `WorkloadModel`
- `workloadId: string`
- `description: string`
- `dominantShape: enum(read_heavy | write_heavy | mixed | compute_heavy | memory_heavy | io_heavy | latency_sensitive | throughput_sensitive)`
- `unitOfWork: string`
- `expectedScale: string`
- `peakScale: string`
- `skewAssumptions: string[]`
- `hotSetAssumptions: string[]`
- `worstCaseAssumptions: string[]`
- `notes?: string[]`

### `Budget`
- `budgetId: string`
- `name: string`
- `operation: string`
- `latencyTarget?: string`
- `tailLatencyTarget?: string`
- `throughputTarget?: string`
- `memoryBudget?: string`
- `cpuBudget?: string`
- `diskBudget?: string`
- `networkBudget?: string`
- `allocationBudget?: string`
- `required: boolean`

### `ResourceModel`
- `resourceId: string`
- `type: enum(cpu | memory | disk | network | gpu | other)`
- `expectedConstraint: string`
- `dominantCharacteristics: string[]`
- `notes?: string[]`

### `HotPath`
- `hotPathId: string`
- `label: string`
- `description: string`
- `trigger: string`
- `frequency: string`
- `dataTouched: string[]`
- `expectedCostDrivers: string[]`
- `bounded: boolean`
- `notes?: string[]`

### `DataModel`
- `dataModelId: string`
- `entity: string`
- `logicalRepresentation: string`
- `runtimeRepresentation: string`
- `storageRepresentation?: string`
- `wireRepresentation?: string`
- `accessPatterns: string[]`
- `layoutChoice: string`
- `hotColdSplit?: string`
- `copyBoundaries?: string[]`
- `notes?: string[]`

### `ExecutionModel`
- `executionModelId: string`
- `processingCadence: string`
- `orderingModel: string`
- `batchingStrategy?: string`
- `flushConditions?: string[]`
- `deferredWorkStrategy?: string`
- `notes?: string[]`

### `MemoryModel`
- `memoryModelId: string`
- `allocationStrategy: string`
- `lifetimeClasses: string[]`
- `dynamicAllocationPolicy: string`
- `workingSetAssumptions: string[]`
- `cacheStrategy?: string`
- `notes?: string[]`

### `ConcurrencyModel`
- `concurrencyModelId: string`
- `model: string`
- `parallelismStrategy: string`
- `contentionPoints: string[]`
- `coordinationMechanisms: string[]`
- `singleThreadRationale?: string`
- `notes?: string[]`

### `BoundednessModel`
- `boundednessModelId: string`
- `boundedQueues: string[]`
- `boundedLoops: string[]`
- `boundedInFlightWork: string[]`
- `boundedMemoryGrowth: string[]`
- `overloadBehavior: string`
- `dropOrBackpressurePolicy: string`
- `notes?: string[]`

### `ObservabilityModel`
- `observabilityModelId: string`
- `metrics: string[]`
- `profilingPlan: string[]`
- `benchmarkPlan: string[]`
- `regressionGuards: string[]`
- `productionSignals: string[]`
- `notes?: string[]`

### `FailureModel`
- `failureModelId: string`
- `degradationStrategy: string`
- `abortConditions: string[]`
- `rollbackStrategy: string`
- `restartBehavior: string`
- `recoveryBehavior: string`
- `coldStartBehavior: string`
- `notes?: string[]`

### `Decision`
- `decisionId: string`
- `label: string`
- `description: string`
- `status: enum(frozen | required_unfrozen | unknown)`
- `owner?: string`
- `appliesToObjectIds: string[]`
- `source: enum(plan | companion_artifact | reviewer_inferred)`

### `Gate`
- `gateId: string`
- `label: string`
- `criteria: string[]`
- `failureOutcome: string`
- `appliesToObjectIds: string[]`

### `StressTest`
- `stressTestId: string`
- `type: enum(missing_workload_model | budgetless_critical_path | wrong_bottleneck_assumption | unbounded_growth | hot_path_allocation_churn | layout_mismatch | false_parallelism | batch_latency_mismatch | control_plane_data_plane_confusion | missing_degradation_behavior | observability_gap | pilot_not_testing_true_risk | scale_semantic_drift | copy_serialization_inflation | cache_illusion)`
- `required: boolean`

### `DeterministicCheck`
- `checkId: string`
- `type: enum(primary_artifact_exists | workload_model_present | unit_of_work_defined | budgets_present_for_critical_operations | hot_paths_identified | runtime_data_models_described | execution_model_defined | memory_model_defined | concurrency_model_defined | boundedness_model_defined | observability_model_defined | failure_model_defined | required_stress_tests_present | review_boundary_is_read_only)`
- `required: boolean`

### `Limits`
- `validatedByReview: string[]`
- `notValidatedByReview: string[]`

## Deterministic scaffold

### Protocol stages
1. Load the architecture and needed companion context.
2. Confirm the review boundary is pre-implementation and read-only.
3. Normalize the review objects.
4. Assign IDs if missing.
5. Run binary deterministic checks.
6. Require all mandatory stress-test categories to appear as evaluated or `not_applicable` with a reason.
7. Review normalized objects.
8. Emit a structured report with findings, required revisions, verdict, and limits.

### Mandatory deterministic checks
- primary artifact exists
- workload model present
- unit of work defined
- budgets present for critical operations
- hot paths identified
- runtime data models described
- execution model defined
- memory model defined
- concurrency model defined
- boundedness model defined
- observability model defined
- failure model defined
- required stress tests present
- review boundary is read-only

## Mandatory stress-test categories

Every review must evaluate these categories:
- missing workload model
- budgetless critical path
- wrong bottleneck assumption
- unbounded growth
- hot-path allocation churn
- layout mismatch
- false parallelism
- batch/latency mismatch
- control-plane/data-plane confusion
- missing degradation behavior
- observability gap
- pilot not testing true risk
- scale semantic drift
- copy/serialization inflation
- cache illusion

## Judgment dimensions

Evaluate the architecture for:
- workload realism
- budget clarity
- mechanical sympathy
- boundedness
- data-layout suitability
- memory predictability
- execution-model fit
- contention realism
- observability sufficiency
- failure/degradation clarity
- revision minimality

## Canonical output schema

### Top level
- `reviewId: string`
- `reviewVersion: integer`
- `inputReviewId?: string`
- `deterministicValidation: object`
- `objectReviews: object`
- `stressTestResults: StressTestResult[]`
- `findings: Finding[]`
- `requiredRevisions: Revision[]`
- `verdict: Verdict`
- `limits: Limits`

### Suggested object reviews
- `workloadReview`
- `budgetReviews`
- `resourceReviews`
- `hotPathReviews`
- `dataModelReviews`
- `executionModelReview`
- `memoryModelReview`
- `concurrencyModelReview`
- `boundednessModelReview`
- `observabilityModelReview`
- `failureModelReview`
- `decisionReviews`
- `gateReviews`

### `StressTestResult`
- `stressTestResultId: string`
- `stressTestId: string`
- `type: string`
- `status: enum(passed | issue_found | not_applicable)`
- `reason?: string`
- `affectedObjectIds?: string[]`
- `notes?: string[]`
- `findingIds?: string[]`

### `Finding`
- `findingId: string`
- `anchorType: enum(workload | budget | resource | hot_path | data_model | execution_model | memory_model | concurrency_model | boundedness_model | observability_model | failure_model | decision | gate | stress_test)`
- `anchorId: string`
- `title: string`
- `summary: string`
- `whyItMatters: string`
- `requiredRevision: string`
- `blocking: boolean`
- `severity?: enum(low | medium | high | blocking)`
- `deterministic?: boolean`

### `Revision`
- `revisionId: string`
- `priority: integer`
- `relatedFindingIds: string[]`
- `instruction: string`
- `kind: enum(workload_definition | budget_definition | hot_path_identification | data_layout_revision | memory_policy_definition | concurrency_assumption_freeze | boundedness_rule | observability_requirement | degradation_rule | gate_definition | other)`
- `mustBeResolvedBeforeExecution: boolean`

### `Verdict`
- `status: enum(ready | ready_with_revisions | not_ready)`
- `summary: string`
- `blockingFindingIds?: string[]`
- `readyCondition?: string`

## Verdict semantics

### `ready`
Use when the review was meaningful, required deterministic checks passed after normalization, and no unresolved substantive finding requires revision before implementation.

### `ready_with_revisions`
Use when the architecture is materially reviewable, but findings require revisions before implementation. Stop, return revisions, and rerun after revision.

### `not_ready`
Use when the design is too incomplete, unstable, or under-specified for a meaningful performance architecture review. Stop and redirect to planning/specification improvement before rerunning.

## Worked example

### Mini input situation
A service design claims low latency and high throughput, but does not define a unit of work, uses a general object graph in the hot request path, and has no overload behavior.

### Example findings
- Anchor: `workload`
  - Summary: Unit of work is missing, so budgets cannot be interpreted consistently.
- Anchor: `data_model`
  - Summary: Runtime representation is optimized for domain modeling rather than request-path access patterns.
- Anchor: `boundedness_model`
  - Summary: Overload behavior is unspecified; queue growth and tail latency are therefore unbounded.

### Example verdict
`ready_with_revisions`

## Canonical invocation phrasing

> Run a Performance Architecture Review on this design. Normalize the workload, budgets, hot paths, data models, execution model, memory model, concurrency model, boundedness model, observability model, and failure model. Apply deterministic checks and required stress tests. Identify structural performance risks, hidden unboundedness, incorrect bottleneck assumptions, and places where the architecture would force expensive behavior by design. Recommend only the revisions needed before implementation, and stay strictly read-only.
