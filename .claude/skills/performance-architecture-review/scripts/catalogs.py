# scripts/catalogs.py

DETERMINISTIC_CHECKS = [
    {
        "id": "CHECK-001",
        "type": "primary_artifact_exists",
        "required": True,
        "description": "Checks if the primary architecture artifact is provided.",
    },
    {
        "id": "CHECK-002",
        "type": "workload_model_present",
        "required": True,
        "description": "Checks if the workload model is defined.",
    },
    {
        "id": "CHECK-003",
        "type": "unit_of_work_defined",
        "required": True,
        "description": "Checks if the unit of work is specified in the workload model.",
    },
    {
        "id": "CHECK-004",
        "type": "budgets_present",
        "required": True,
        "description": "Checks if at least one budget is defined.",
    },
    {
        "id": "CHECK-005",
        "type": "hot_paths_identified",
        "required": True,
        "description": "Checks if at least one hot path is identified.",
    },
    {
        "id": "CHECK-006",
        "type": "execution_model_defined",
        "required": True,
        "description": "Checks if the execution model is defined.",
    },
    {
        "id": "CHECK-007",
        "type": "memory_model_defined",
        "required": True,
        "description": "Checks if the memory model is defined.",
    },
    {
        "id": "CHECK-008",
        "type": "concurrency_model_defined",
        "required": True,
        "description": "Checks if the concurrency model is defined.",
    },
    {
        "id": "CHECK-009",
        "type": "boundedness_model_defined",
        "required": True,
        "description": "Checks if the boundedness model is defined.",
    },
    {
        "id": "CHECK-010",
        "type": "observability_model_defined",
        "required": True,
        "description": "Checks if the observability model is defined.",
    },
    {
        "id": "CHECK-011",
        "type": "failure_model_defined",
        "required": True,
        "description": "Checks if the failure/degradation model is defined.",
    },
    {
        "id": "CHECK-012",
        "type": "review_boundary_is_read_only",
        "required": True,
        "description": "Checks if the review boundary is set to read-only pre-implementation.",
    },
]

STRESS_TEST_CATEGORIES = [
    {
        "id": "TEST-001",
        "type": "missing_workload_model",
        "required": True,
        "description": "Evaluates if the design defines a clear workload model.",
    },
    {
        "id": "TEST-002",
        "type": "budgetless_critical_path",
        "required": True,
        "description": "Assesses if hot paths lack explicit performance budgets.",
    },
    {
        "id": "TEST-003",
        "type": "wrong_bottleneck_assumption",
        "required": True,
        "description": "Identifies if the architecture optimizes for the wrong resource (e.g., CPU vs. memory/IO).",
    },
    {
        "id": "TEST-004",
        "type": "unbounded_growth",
        "required": True,
        "description": "Detects unbounded queues, retries, memory growth, or other uncontrolled resource usage.",
    },
    {
        "id": "TEST-005",
        "type": "hot_path_allocation_churn",
        "required": True,
        "description": "Assesses excessive allocation/deallocation in hot paths.",
    },
    {
        "id": "TEST-006",
        "type": "layout_mismatch",
        "required": True,
        "description": "Checks if data layout is misaligned with access patterns or hardware caches.",
    },
    {
        "id": "TEST-007",
        "type": "false_parallelism",
        "required": True,
        "description": "Evaluates if concurrency strategy introduces more overhead than benefit due to contention.",
    },
    {
        "id": "TEST-008",
        "type": "batch_latency_mismatch",
        "required": True,
        "description": "Determines if batching strategy is inappropriate for target latency requirements.",
    },
    {
        "id": "TEST-009",
        "type": "missing_degradation_behavior",
        "required": True,
        "description": "Checks for a clear plan for performance degradation under load or failure.",
    },
    {
        "id": "TEST-010",
        "type": "observability_gap",
        "required": True,
        "description": "Identifies missing metrics, tracing, or logging for performance monitoring.",
    },
]

OUTPUT_OBJECT_KEYS = [
    "workloadReview",
    "budgetReviews",
    "resourceReviews",
    "hotPathReviews",
    "dataModelReviews",
    "executionModelReview",
    "memoryModelReview",
    "concurrencyModelReview",
    "boundednessModelReview",
    "observabilityModelReview",
    "failureModelReview",
    "decisionReviews",
    "gateReviews",
]

VERDICT_STATUSES = ["ready", "ready_with_revisions", "not_ready"]
SEVERITIES = ["low", "medium", "high", "blocking"]

# Canonical input schema structure (simplified for script use)
CANONICAL_INPUT_SCHEMA_KEYS = {
    "architecture": {
        "primaryArtifact": str,
        "systemType": str,
        "performanceSensitivity": str,
    },
    "reviewBoundary": {
        "preImplementation": bool,
        "readOnly": bool,
        "noSilentRedesign": bool,
        "noImplementation": bool,
        "noLiveExecution": bool,
        "reviewGoal": str,
    },
    "workload": {
        "description": str,
        "dominantShape": str,
        "unitOfWork": str,
        "expectedScale": str,
    },
    "budgets": list,  # Expect a list of Budget objects
    "hotPaths": list,  # Expect a list of HotPath objects
    "dataModels": list,  # Expect a list of DataModel objects
    "executionModel": {"processingCadence": str, "orderingModel": str},
    "memoryModel": {"allocationStrategy": str, "lifetimeClasses": list},
    "concurrencyModel": {"model": str, "parallelismStrategy": str},
    "boundednessModel": {"boundedQueues": list, "overloadBehavior": str},
    "observabilityModel": {"metrics": list, "profilingPlan": list},
    "failureModel": {"degradationStrategy": str, "rollbackStrategy": str},
    # Decisions and Gates are optional top-level lists, and can be checked for presence if required
    "decisions": list,
    "gates": list,
}
