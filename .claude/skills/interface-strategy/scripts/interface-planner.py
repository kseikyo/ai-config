#!/usr/bin/env python3
"""
Interface Strategy Planner - Deterministic Document Generator

Generates interface strategy documents following the three-layer framework:
1. Experience Foundation
2. Interface Boosting
3. Emotional Design Integration

Usage:
    python interface-planner.py --interactive   # Interactive mode
    python interface-planner.py --input notes.md --output SPEC.md
    python interface-planner.py --template     # Show template
"""

import argparse
import sys
from pathlib import Path
from datetime import datetime

TEMPLATE = """# Interface Strategy: {project_name}

Generated: {date}

---

## Layer 1: Experience Foundation

### Core Job Statement
_One sentence describing what this interface accomplishes_

### Current User Journey
1. 
2. 
3. 

### Friction Points
- 
- 

### Optimization Opportunities
- 
- 

---

## Layer 2: Interface Boosting

### 50ms Trust Test
_Describe the first visual impression_

### Primary CTAs
- 

### Visual Hierarchy Plan
- 
- 

### Strategic Color Usage
- Primary (conversion): 
- Secondary (support): 
- Background (breathing room): 

---

## Layer 3: Emotional Design Integration

### High-Impact Moments
- 
- 

### Emotional Patterns to Implement
- [ ] Progress Celebration: 
- [ ] Achievement System: 
- [ ] Brand Reinforcement: 
- [ ] Trust-Building (if applicable): 

### Retention Mechanics
- Streak system: 
- Loss aversion: 
- Progress visualization: 

---

## Implementation Notes

### Next Steps
1. 
2. 
3. 

### Dependencies
- 
"""


def ask_question(prompt: str, default: str = "") -> str:
    """Ask a question and return the answer."""
    if default:
        response = input(f"{prompt} [{default}]: ").strip()
        return response if response else default
    else:
        response = input(f"{prompt}: ").strip()
        return response


def interactive_mode():
    """Run interactive mode to gather inputs and generate document."""
    print("=" * 60)
    print("Interface Strategy Planner - Three-Layer Framework")
    print("=" * 60)
    print()

    project_name = ask_question("Project/Feature name", "My Interface")
    print()

    # Layer 1: Experience Foundation
    print("-" * 40)
    print("LAYER 1: Experience Foundation")
    print("-" * 40)

    core_job = ask_question("What is the ONE core job this interface accomplishes?")
    print()

    print("Map the user journey (press Enter on empty line to finish):")
    journey = []
    while True:
        step = input(f"  Step {len(journey) + 1}: ").strip()
        if not step:
            break
        journey.append(step)

    print()
    print("List friction points (press Enter on empty line to finish):")
    friction = []
    while True:
        point = input("  Friction: ").strip()
        if not point:
            break
        friction.append(point)

    print()
    print("List optimization opportunities (press Enter on empty line to finish):")
    optimizations = []
    while True:
        opt = input("  Opportunity: ").strip()
        if not opt:
            break
        optimizations.append(opt)

    print()

    # Layer 2: Interface Boosting
    print("-" * 40)
    print("LAYER 2: Interface Boosting")
    print("-" * 40)

    trust_impression = ask_question("Describe the 50ms trust impression (first visual)")
    print()

    print("Primary CTAs (press Enter on empty line to finish):")
    ctas = []
    while True:
        cta = input("  CTA: ").strip()
        if not cta:
            break
        ctas.append(cta)

    print()
    primary_color = ask_question("Primary accent color (for CTAs)", "#6366f1")
    secondary_color = ask_question("Secondary color", "#64748b")

    print()

    # Layer 3: Emotional Design Integration
    print("-" * 40)
    print("LAYER 3: Emotional Design Integration")
    print("-" * 40)

    print(
        "High-impact moments for emotional design (press Enter on empty line to finish):"
    )
    emotional_moments = []
    while True:
        moment = input("  Moment: ").strip()
        if not moment:
            break
        emotional_moments.append(moment)

    print()
    has_streak = ask_question("Implement streak system? (y/n)", "y")
    has_achievements = ask_question("Implement achievements/levels? (y/n)", "y")
    is_trust_sensitive = ask_question("Trust-sensitive audience? (y/n)", "n")

    print()

    # Generate document
    doc = TEMPLATE.format(
        project_name=project_name, date=datetime.now().strftime("%Y-%m-%d")
    )

    # Fill in Layer 1
    doc = doc.replace(
        "_One sentence describing what this interface accomplishes_", core_job
    )

    journey_section = (
        "\n".join(f"{i + 1}. {s}" for i, s in enumerate(journey)) if journey else "1. "
    )
    doc = doc.replace("1. \n2. \n3. ", journey_section)

    friction_section = "\n- ".join(friction) if friction else "- "
    doc = doc.replace("- \n- ", friction_section)

    opt_section = "\n- ".join(optimizations) if optimizations else "- "
    doc = doc.replace(optimizations[0] if optimizations else "- ", opt_section, 1)

    # Fill in Layer 2
    doc = doc.replace("_Describe the first visual impression_", trust_impression)

    cta_section = "\n- ".join(ctas) if ctas else "- "
    doc = doc.replace("- ", cta_section)

    doc = doc.replace(
        "Primary (conversion): ", f"Primary (conversion): {primary_color}"
    )
    doc = doc.replace(
        "Secondary (support): ", f"Secondary (support): {secondary_color}"
    )
    doc = doc.replace("Background (breathing room): ", "Background (breathing room): ")

    # Fill in Layer 3
    moment_section = "\n- ".join(emotional_moments) if emotional_moments else "- "
    doc = doc.replace("- \n- ", moment_section, 1)

    streak_check = " [x] " if has_streak.lower() == "y" else " [ ] "
    doc = doc.replace(
        "[ ] Progress Celebration:", f"{streak_check}Progress Celebration:"
    )

    achievement_check = " [x] " if has_achievements.lower() == "y" else " [ ] "
    doc = doc.replace(
        "[ ] Achievement System:", f"{achievement_check}Achievement System:"
    )

    trust_check = " [x] " if is_trust_sensitive.lower() == "y" else " [ ] "
    doc = doc.replace("[ ] Brand Reinforcement:", f"{trust_check}Brand Reinforcement:")
    doc = doc.replace(
        "[ ] Trust-Building (if applicable):",
        f"{trust_check}Trust-Building (if applicable):",
    )

    # Output
    print("=" * 60)
    print("GENERATED STRATEGY DOCUMENT")
    print("=" * 60)
    print()
    print(doc)

    # Save option
    save = ask_question("\nSave to SPEC.md? (y/n)", "y")
    if save.lower() == "y":
        Path("SPEC.md").write_text(doc)
        print("Saved to SPEC.md")

    return doc


def main():
    parser = argparse.ArgumentParser(
        description="Interface Strategy Planner - Three-Layer Framework"
    )
    parser.add_argument(
        "--interactive", "-i", action="store_true", help="Run in interactive mode"
    )
    parser.add_argument("--input", "-f", type=str, help="Input file with notes")
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default="SPEC.md",
        help="Output file (default: SPEC.md)",
    )
    parser.add_argument(
        "--template", "-t", action="store_true", help="Show template and exit"
    )

    args = parser.parse_args()

    if args.template:
        print(TEMPLATE.format(project_name="Example", date="2024-01-01"))
        return

    if args.interactive:
        interactive_mode()
    elif args.input:
        # TODO: Parse input and generate from notes
        print(f"Parsing {args.input} and generating {args.output}...")
        # For now, show template
        doc = TEMPLATE.format(
            project_name=Path(args.input).stem, date=datetime.now().strftime("%Y-%m-%d")
        )
        Path(args.output).write_text(doc)
        print(f"Generated {args.output}")
    else:
        parser.print_help()
        print()
        print("Examples:")
        print("  python interface-planner.py --interactive")
        print("  python interface-planner.py --template")
        print("  python interface-planner.py --input notes.md --output SPEC.md")


if __name__ == "__main__":
    main()
