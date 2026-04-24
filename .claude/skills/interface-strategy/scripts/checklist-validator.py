#!/usr/bin/env python3
"""
Interface Strategy Checklist Validator

Validates that an interface strategy document covers all three layers
with sufficient detail.

Usage:
    python checklist-validator.py --spec SPEC.md
    python checklist-validator.py --spec SPEC.md --verbose
"""

import argparse
import re
from pathlib import Path


LAYER1_CHECKS = [
    (r"core job", "Core job statement"),
    (r"user journey|journey.*step|step.*1|step.*2|step.*3", "User journey mapped"),
    (r"friction|problem|pain point", "Friction points identified"),
    (
        r"optimization|improv.*faster|better|reduce|eliminate",
        "Optimization opportunities",
    ),
]

LAYER2_CHECKS = [
    (
        r"50ms|trust.*test|first.*impression|visual.*impression",
        "50ms trust test addressed",
    ),
    (r"CTA|call.*to.*action|primary.*button|conversion", "Primary CTAs defined"),
    (r"visual hierarchy|hierarchy|weight|emphasis", "Visual hierarchy plan"),
    (r"color|contrast|accent", "Color/contrast strategy"),
]

LAYER3_CHECKS = [
    (r"emotional|feeling|connection|human", "Emotional design considered"),
    (r"progress|celebrat.*completion|accomplish", "Progress celebration"),
    (r"streak|consecutive|return.*day", "Streak/retention mechanic"),
    (r"achievement|level|tier|badge", "Achievement system"),
    (
        r"onboarding|welcome|first.*experience|trust.*sensitive",
        "Onboarding/trust building",
    ),
]


def validate_spec(content: str, verbose: bool = False) -> dict:
    """Validate a spec document against the three-layer framework."""
    content_lower = content.lower()

    results = {
        "layer1": {"score": 0, "total": len(LAYER1_CHECKS), "items": []},
        "layer2": {"score": 0, "total": len(LAYER2_CHECKS), "items": []},
        "layer3": {"score": 0, "total": len(LAYER3_CHECKS), "items": []},
    }

    for pattern, description in LAYER1_CHECKS:
        found = bool(re.search(pattern, content_lower))
        results["layer1"]["items"].append((description, found))
        if found:
            results["layer1"]["score"] += 1

    for pattern, description in LAYER2_CHECKS:
        found = bool(re.search(pattern, content_lower))
        results["layer2"]["items"].append((description, found))
        if found:
            results["layer2"]["score"] += 1

    for pattern, description in LAYER3_CHECKS:
        found = bool(re.search(pattern, content_lower))
        results["layer3"]["items"].append((description, found))
        if found:
            results["layer3"]["score"] += 1

    return results


def print_results(results: dict, verbose: bool = False):
    """Print validation results."""

    def pct(score, total):
        return f"{score}/{total} ({100 * score // total}%)"

    print("=" * 50)
    print("INTERFACE STRATEGY VALIDATION")
    print("=" * 50)
    print()

    for layer, data in [
        ("Layer 1: Experience Foundation", results["layer1"]),
        ("Layer 2: Interface Boosting", results["layer2"]),
        ("Layer 3: Emotional Design", results["layer3"]),
    ]:
        print(f"{layer}")
        print("-" * 40)

        for item, found in data["items"]:
            status = "✓" if found else "✗"
            print(f"  {status} {item}")

        print(f"\n  Score: {pct(data['score'], data['total'])}")
        print()

    total_score = sum(r["score"] for r in results.values())
    total_total = sum(r["total"] for r in results.values())

    print("=" * 50)
    overall = 100 * total_score // total_total

    if overall >= 80:
        print(f"OVERALL: {pct(total_score, total_total)} - EXCELLENT")
    elif overall >= 60:
        print(f"OVERALL: {pct(total_score, total_total)} - GOOD")
    elif overall >= 40:
        print(f"OVERALL: {pct(total_score, total_total)} - NEEDS WORK")
    else:
        print(f"OVERALL: {pct(total_score, total_total)} - INCOMPLETE")

    print("=" * 50)


def main():
    parser = argparse.ArgumentParser(
        description="Validate interface strategy completeness"
    )
    parser.add_argument(
        "--spec", "-s", required=True, type=str, help="Path to SPEC.md file"
    )
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")

    args = parser.parse_args()

    spec_path = Path(args.spec)
    if not spec_path.exists():
        print(f"Error: {args.spec} not found")
        return 1

    content = spec_path.read_text()
    results = validate_spec(content, args.verbose)
    print_results(results, args.verbose)

    return 0


if __name__ == "__main__":
    exit(main())
