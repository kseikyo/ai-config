# Interface Strategy Tasks

Use this command to break an interface strategy plan into granular, executable tasks.

## Input

A PLAN.md exists with tasks grouped by layer.

## Process

1. Read the PLAN.md
2. For each task, create subtasks that can be completed in one session
3. Add acceptance criteria for each task
4. Order tasks respecting layer dependencies

## Output

Generate a TASKS.md with:
- Individual tasks with clear descriptions
- Checkboxes for completion
- Notes on layer order (Layer 1 → 2 → 3)

## Example Format

```markdown
## Layer 1: Experience Foundation

- [ ] Implement core user flow
  - Notes: Must complete before any UI work

## Layer 2: Interface Boosting

- [ ] Design primary CTA component
  - Notes: Depends on Layer 1 flow
  
## Layer 3: Emotional Design

- [ ] Add progress celebration animation
  - Notes: Depends on Layer 2 components
```
