---
name: shapeup
description: "Shape Up methodology for idea-to-beads planning with Socratic guidance and smart phase detection"
category: orchestration
complexity: advanced
mcp-servers: [sequential, serena]
personas: [architect, analyzer, project-manager]
---

# /ls:shapeup - Shape Up Planning Skill

> **Context Framework Note**: This file provides behavioral instructions for Claude Code when users type `/ls:shapeup`. Activates Socratic-guided planning that produces actionable beads tasks.

## Mode Requirement

**CRITICAL**: This skill requires execute mode. If in plan mode, inform user:
> "⚠️ /ls:shapeup requires execute mode to create beads and run scripts. Please exit plan mode first."

Do NOT proceed if plan mode is active.

---

## Startup Sequence (ALWAYS EXECUTE FIRST)

When `/ls:shapeup` is invoked:

**Step 1**: Detect starting phase
```bash
PHASE=$(/Users/lucassierota/.claude/commands/ls/scripts/phase-detect.sh "[user input]")
```

**Step 2**: Initialize phase tracking
```
TodoWrite: Create tracker with current phase
```

**Step 3**: Display phase banner
```
═══════════════════════════════════════════════════════════════
                    SHAPE UP: [PHASE NAME]
═══════════════════════════════════════════════════════════════
```

**Step 4**: Begin phase-specific behavior (see Phase Behaviors below)

---

## Phase State Machine

**CRITICAL**: Track current phase explicitly. Only transition when user says "next".

### Phases
```
CAPTURE → QUALIFY → APPETITE → SHAPE → DE-RISK → PITCH → BET → BUILD
```

### Transition Rules
| From | To | Criteria | User Must Say |
|------|-----|----------|---------------|
| CAPTURE | QUALIFY | Idea documented with source | "next" |
| QUALIFY | APPETITE | Problem scored HIGH (10+) | "next" |
| APPETITE | SHAPE | Batch size decided (small/big) | "next" |
| SHAPE | DE-RISK | Solution is rough+solved+bounded | "next" |
| DE-RISK | PITCH | All risks addressed/cut | "next" |
| PITCH | BET | Pitch document complete | "next" |
| BET | BUILD | User says BET=YES | "next" |
| BUILD | DONE | Shipped to production | "done" |

**Trigger words for transition**: next, continue, proceed, advance, move on

---

## Conversational Loop Pattern

**For EVERY phase, follow this exact pattern:**

1. **ANNOUNCE** - Display phase banner with current phase name
2. **ASK** - Present phase-specific Socratic questions (one at a time or grouped)
3. **WAIT** - Stop and wait for user response. Do NOT proceed without input.
4. **RECORD** - Capture user's answers
5. **EVALUATE** - Check if transition criteria are met
6. **INFORM** - If criteria met, tell user: "✅ Ready to proceed. Say 'next' to advance to [NEXT PHASE]."
7. **WAIT FOR "next"** - Only transition when user explicitly says "next"
8. **TRANSITION** - Move to next phase, update TodoWrite

---

## Phase Behaviors

### Phase 1: CAPTURE
**Goal**: Capture raw idea without solutioning

**ACTIONS**:
1. Display CAPTURE banner
2. Ask questions one at a time:

**QUESTIONS**:
- "Where did this idea come from?"
- "Who requested it? What were their exact words?"
- "What context was provided?"

**WAIT**: For each answer before asking next question.

**OUTPUT**: Raw idea capture with source attribution

**EVALUATION**: Idea is documented with source → Ready for QUALIFY

**ON READY**:
> "✅ Idea captured. Say 'next' to qualify this problem."

---

### Phase 2: QUALIFY
**Goal**: Determine if problem is worth pursuing

**ACTIONS**:
1. Display QUALIFY banner
2. Ask scoring questions:

**QUESTIONS**:
- "What problem does this solve?"
- "Who is affected by this problem?"
- "How often does this happen? (1=rare, 5=daily) → FREQUENCY"
- "How bad is it when it hits? (1=minor, 5=critical) → SEVERITY"
- "What's the current workaround? (1=easy, 5=painful) → DIFFICULTY"

**WAIT**: Collect all scores.

**SCORING**: Calculate Frequency × Severity × Difficulty
- Score 10+: HIGH PRIORITY → Ready for APPETITE
- Score 6-9: MEDIUM → Consider DISCOVERY sub-mode
- Score 1-5: LOW → Suggest PARK or DROP

**OUTPUT**: Problem statement with priority score

**ON HIGH SCORE**:
> "✅ Score: [X] - HIGH PRIORITY. Say 'next' to set appetite."

**ON LOW SCORE**:
> "⚠️ Score: [X] - LOW PRIORITY. Consider parking this idea. Say 'next' to continue anyway, or 'park' to save for later."

---

### Phase 3: APPETITE
**Goal**: Decide time investment (worth, not duration)

**ACTIONS**:
1. Display APPETITE banner
2. Present options and ask questions:

**QUESTIONS**:
- "How much is this WORTH to us? (not how long will it take)"
- "What's the impact if solved?"
- "What's the risk of NOT doing it?"

**OPTIONS** (present to user):
- **Small Batch** (1-2 weeks): Quick wins, minor improvements
- **Big Batch** (6 weeks): Major features, complex systems
- **Too Big** (6+ weeks): Must be split → return to QUALIFY

**WAIT**: For user to choose batch size.

**OUTPUT**: Appetite decision with rationale

**ON DECISION**:
> "✅ Appetite set: [BATCH SIZE]. Say 'next' to start shaping the solution."

---

### Phase 4: SHAPE
**Goal**: Design rough but complete solution

**ACTIONS**:
1. Display SHAPE banner
2. Guide solution design:

**QUESTIONS**:
- "What's the smallest solution that works?"
- "What are the key elements/components?"
- "What's the happy path flow?"
- "What are the boundaries - where do we stop?"

**SOLUTION FORMATS** (help user create one):
- **Breadboard**: Text-based flow (Place → [Affordance] → Place)
- **Fat Marker Sketch**: Rough visual description, no details

**CHECKLIST** (evaluate with user):
- [ ] ROUGH? Room for team interpretation
- [ ] SOLVED? Main elements defined, clear direction
- [ ] BOUNDED? Clear scope, know where to stop

**WAIT**: Until all three criteria are checked.

**OUTPUT**: Solution sketch meeting all three criteria

**ON COMPLETE**:
> "✅ Solution shaped (rough, solved, bounded). Say 'next' to identify risks."

---

### Phase 5: DE-RISK
**Goal**: Remove unknowns that could blow up the project

**ACTIONS**:
1. Display DE-RISK banner
2. Identify risks by category:

**QUESTIONS**:
- "What could go wrong here?"
- "What don't we know?"
- "What looks simple but isn't?"

**RISK CATEGORIES**:

**Technical Risks** ("Can we do it?"):
- For each: Doable → document | Caveats → constrain | No/unclear → CUT or SPIKE

**Design Risks** ("Edge cases?"):
- For each: Define behavior | Declare OUT OF BOUNDS | Simplify to avoid

**Integration Risks** ("Dependencies?"):
- For each: Confirm availability | Design around | Cut if unresolved

**WAIT**: Until each risk has a resolution (documented/constrained/cut).

**OUTPUT**: Risk register with mitigations

**ON COMPLETE**:
> "✅ Risks addressed. Say 'next' to create the pitch."

---

### Phase 6: PITCH
**Goal**: Package everything for betting table

**ACTIONS**:
1. Display PITCH banner
2. Generate pitch document from collected information:

**PITCH STRUCTURE** (generate this document):
```
# PITCH: [Title]

## 1. PROBLEM
- What's broken: [from QUALIFY]
- Who's affected: [from QUALIFY]
- Evidence: [quotes, data, examples]
- Cost of inaction: [from APPETITE]

## 2. APPETITE
- Batch: [Small/Big] ([timeframe])
- Rationale: [from APPETITE]

## 3. SOLUTION
- [Breadboard or sketch from SHAPE]
- Key elements: [from SHAPE]
- How it solves the problem: [connection]

## 4. RABBIT HOLES
- [Risk 1]: [Resolution from DE-RISK]
- [Risk 2]: [Resolution from DE-RISK]

## 5. NO-GOS
- [Explicit exclusions from SHAPE boundaries]
```

**WAIT**: Show pitch document to user for review.

**OUTPUT**: Complete pitch document

**ON COMPLETE**:
> "✅ Pitch ready. Say 'next' to make the bet decision."

---

### Phase 7: BET
**Goal**: Commit decision

**ACTIONS**:
1. Display BET banner
2. Present betting questions:

**BETTING QUESTIONS** (ask all):
1. "Does the problem matter? Urgent? Strategic?"
2. "Is the appetite right?"
3. "Is the solution attractive? Elegant?"
4. "Is this the right time? Aligns with priorities?"
5. "Are the right people available?"

**WAIT**: For user to answer and make decision.

**DECISION PROMPT**:
> "Based on your answers: BET (commit to this work) or DON'T BET (let it go)?"

---

**ON BET = YES**:

1. Generate beads JSON from pitch:
```json
{
  "epic": {
    "title": "[Pitch title]",
    "description": "[Problem + Solution summary]",
    "priority": "P[0-3 based on score]",
    "appetite": "[small|big]"
  },
  "tasks": [
    {
      "title": "[Key element 1 from solution]",
      "description": "[Scope from shaping]",
      "priority": "P2",
      "subtasks": ["[Subtask 1]", "[Subtask 2]"]
    }
  ]
}
```

2. Create beads hierarchy:
```bash
echo '[GENERATED_JSON]' | /Users/lucassierota/.claude/commands/ls/scripts/beads-create.sh -
```

3. Show created hierarchy to user

4. Inform user:
> "✅ Beads created! Say 'next' to enter BUILD phase."

---

**ON BET = NO**:
> "Understood. Good ideas resurface. This pitch is documented for future consideration."
>
> END workflow.

---

### Phase 8: BUILD
**Goal**: Ship working software in cycle

**ACTIONS ON ENTRY**:
1. Display BUILD banner
2. **Immediately show hill chart**:
```bash
/Users/lucassierota/.claude/commands/ls/scripts/hill-chart.sh
```

**BUILD GUIDANCE**:

**Week 1 - Orientation**:
- Team reads the pitch
- Explore the problem space
- Identify first scope to tackle
- Get one piece DONE end-to-end

**Weeks 2-4 - Map Scopes**:
- Organize into vertical slices
- Good scopes: "Email notifications", "Dashboard filters"
- Bad scopes: "Frontend work", "Database stuff"

**Weeks 5-6 - Scope Hammer**:
- "What can we cut and still solve the core problem?"
- "Is this must-have or nice-to-have?"
- Compare to BASELINE, not ideal

**PROGRESS CHECK-INS**:
When user asks for status/progress, run:
```bash
/Users/lucassierota/.claude/commands/ls/scripts/hill-chart.sh
```

**END OF CYCLE**:
- Done = Deployed to production
- Core problem solved
- Works better than baseline

**CIRCUIT BREAKER**:
- NOT SHIPPED by deadline → By default: Cancel
- Exception: Extend only if very close AND still makes sense

---

## Discovery Sub-Mode

**Trigger**: Problem unclear at QUALIFY phase (score 6-9 MEDIUM)

### When to Use
- Vague idea needs clarity
- Don't understand WHY something was requested
- Suspect bigger problem hiding

### Interview Guide

**OPEN** (5 min): Build context
- "I'm trying to understand [area]."

**CONTEXT** (5-10 min): Map the workflow
- "Walk me through a typical [day/week/process]"

**DIG INTO PAIN** (15-20 min): Find problems
- "What's the most frustrating part?"
- "Where do things usually go wrong?"
- For each problem: "Tell me about the last time that happened"

**EXPLORE SOLUTIONS** (5 min): Understand expectations
- "How do you handle this today?"
- "What would 'good enough' look like?"

**CLOSE** (5 min): Expand scope
- "What question should I have asked?"
- "Who else should I talk to?"

### After Discovery
→ Return to QUALIFY with clear problem statement

---

## Script Reference

| Script | When to Use | Command |
|--------|------------|---------|
| phase-detect.sh | Startup | `scripts/phase-detect.sh "[input]"` |
| beads-create.sh | BET=YES | `echo 'JSON' \| scripts/beads-create.sh -` |
| hill-chart.sh | BUILD entry + progress | `scripts/hill-chart.sh` |
| repo-detect.sh | Before beads init | `scripts/repo-detect.sh` |

Scripts location: `/Users/lucassierota/.claude/commands/ls/scripts/`

---

## Examples

### Vague Idea
```
User: /ls:shapeup "I want to improve the dashboard"

Claude: [Runs phase-detect.sh → CAPTURE]
        [Displays CAPTURE banner]
        "Where did this idea come from?"
User: "Marketing team mentioned it in standup"
Claude: "Who specifically? What were their exact words?"
User: "Sarah said 'the dashboard is confusing'"
Claude: "✅ Idea captured. Say 'next' to qualify this problem."
User: "next"
Claude: [Transitions to QUALIFY, displays banner, asks scoring questions...]
```

### Ready to Bet
```
User: /ls:shapeup --phase BET "Review the auth overhaul pitch"

Claude: [Skips to BET phase]
        [Presents betting questions]
User: [Answers all questions positively]
Claude: "BET or DON'T BET?"
User: "BET"
Claude: [Generates JSON, runs beads-create.sh]
        "✅ Beads created! Say 'next' to enter BUILD."
```

---

## Boundaries

**Will:**
- Guide through Shape Up phases with Socratic questions
- Wait for explicit "next" before transitioning phases
- Create beads via script after BET decision
- Show hill chart in BUILD phase and on progress requests
- Track phase state using TodoWrite

**Will Not:**
- Auto-advance phases without user confirmation
- Make bet decisions autonomously (user decides)
- Create beads before BET approval
- Run in plan mode (requires execute mode)
- Skip phases without explicit --phase flag
