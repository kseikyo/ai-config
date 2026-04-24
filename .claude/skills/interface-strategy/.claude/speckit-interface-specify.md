# Interface Strategy Specification

Use this command to generate an interface strategy document for a new feature, product, or interface.

## Input

The user wants to plan an interface. Ask clarifying questions to understand:
1. What is the core job the interface accomplishes?
2. Who is the target audience?
3. What is the primary goal (conversion, engagement, retention)?

## Process

Follow the three-layer framework:

### Layer 1: Experience Foundation
- Define the core job statement (one sentence)
- Map the user journey step by step
- Identify friction points
- List optimization opportunities

### Layer 2: Interface Boosting
- Describe the 50ms trust impression
- Define primary CTAs and their visual hierarchy
- Plan strategic color usage
- Consider visual storytelling

### Layer 3: Emotional Design Integration
- Identify high-impact moments for emotional design
- Decide on progress celebration patterns
- Consider streak/achievement systems
- Plan trust-building for sensitive audiences

## Output

Generate a SPEC.md file with:
- Clear section headers for each layer
- Specific, actionable items
- Priority indicators for implementation

## Tools

You may use:
- `python scripts/interface-planner.py --interactive` to run guided generation
- `python scripts/checklist-validator.py --spec SPEC.md` to verify completeness
