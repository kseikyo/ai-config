---
name: interface-strategy
description: >-
  Strategic interface planning using the three-layer framework (Experience
  Foundation, Interface Boosting, Emotional Design Integration). Use this skill
  when users ask: plan interface, design strategy, user experience, onboarding
  flow, engagement, stickiness, retention, emotional design, trust signals,
  conversion, addictive products, 50ms trust test, Duolingo-style retention,
  user journey mapping, feature planning. Triggers on: "how should I design",
  "plan the interface", "improve UX", "make it engaging", "onboarding flow",
  "user journey", "conversion optimization", "trust signals", "emotional
  design", "how do I make people addicted".
---

# Interface Strategy

> **Research**: See [references/research.md](references/research.md) for 110+ sources on behavioral psychology, academic papers, Duolingo case studies, and LLM efficiency.
>
> **Warning on Design Systems**: shadcn/ui and Radix UI provide excellent accessible primitives, but their default tokens are GENERIC. Always customize with brand-specific OKLCH values.

> **Deterministic Layer**: Run `python scripts/interface-planner.py --interactive` to generate a complete interface strategy document.
> 
> **Spec Kit Integration**: Use `/speckit.specify` after initializing with `specify init` for AI-assisted specification.

**Philosophy**: Interface design is applied psychology — every element either builds trust, creates habit, or drives action. The three-layer framework works because it mirrors how humans form relationships: first solve my problem (foundation), then earn my trust (visual), then make me care (emotion). Skipping layers creates fragile products.

A framework for building interfaces that are not just functional, but addictive and memorable. Based on the three-layer framework for creating products users can't put down.

## When to Use This Skill

Use this skill proactively when:
- Planning a new feature or product
- Designing onboarding flows
- Thinking about user engagement and retention
- Creating conversion pathways
- Building trust signals into the interface
- Adding emotional design elements
- Reviewing existing interfaces for improvement

## The Three Layers

Before touching any code or visual design, apply these three layers in order:

> **Quick Reference**: See [references/checklist.md](references/checklist.md) for printable checklist.
> 
> **Scripted Execution**: Run `python scripts/checklist-validator.py --spec path/to/SPEC.md` to verify completeness.

### Layer 1: Experience Foundation

**The principle**: Your app should help people get their jobs done as smoothly and as quickly as possible. No amount of beautiful animation can save a broken core experience.

**The 3-Second Test**: Before anything else, study your competition. You cannot improve what you don't understand.

**Competitive Research Process:**

1. **Map the Competitive Landscape**
   - Direct competitors (same problem, same solution)
   - Indirect competitors (same problem, different solution)
   - Aspirational (unrelated industry, world-class UX)

2. **Task-Based Walkthroughs**
   - Record yourself completing competitor core flows
   - Count steps to value (Time-to-Value)
   - Identify friction points and workarounds

3. **Heuristic Scoring**
   - Evaluate against Nielsen's 10 Heuristics
   - Score: 1-5 on execution quality
   - Document the "Why" - why does this work or fail?

4. **Gap Analysis**
   - Parity: What must we have?
   - Differentiators: Why do users choose them?
   - Opportunities: What friction haven't they solved?

**Before you design anything, answer:**

1. **What is the core job the user is hiring this interface to do?**
   - Write this in one sentence
   - Be specific: not "order food" but "get my favorite pizza delivered to my door at 6pm with zero friction"

2. **What is the current experience?**
   - Map out every step in the flow
   - Identify friction points
   - Time each step: where do users wait?

3. **How can this be faster/better?**
   - Can you reduce steps?
   - Can you eliminate input?
   - Can you predict what they need?

**Friction Sweet Spot**: UX is not about removing ALL friction. It's about finding the RIGHT level.

- Too much friction: users give up
- Too little friction: users are confused, don't see value
- The sweet spot: show just enough to create value without overwhelming

**Process:**
1. Run a strategy session to understand core problems
2. Create a comprehensive strategy document BEFORE touching design software
3. Map screen flows and connected features
4. Only then create wireframes and prototypes to hone the experience
5. Document insights as AI-ready prompts for rapid prototyping

**If you skip this layer**: You'll build something beautiful that nobody wants to use.

**Example:**
| Bad | Good |
|-----|------|
| "Order food" | "Get my favorite pizza at 6pm with 2 taps" |
| 5 screens to checkout | 1 screen, predicted defaults |
| Manual login every time | Biometric + token refresh |
| Never looked at competitor | Mapped 5 competitors, found their 4-step weakness |

---

### Layer 2: Interface Boosting

**The principle**: Once your experience works flawlessly, turn your visual interface into your trust badge. People make trust decisions about your app within 50 milliseconds of seeing it.

**The 50ms Trust Test:**
- Clean, professional interface → signals reliability
- Poor visual design → triggers warning signals, users leave
- Getting this wrong scares away 20-30% of users immediately
- Design for immediate trust or lose potential revenue

**First Impressions Checklist (The 5 Fundamentals):**
1. **Clean hierarchy** - Clear visual order, most important element is obvious
2. **Generous spacing** - Room to breathe = professionalism
3. **Professional imagery** - Supports the headline, not distracts
4. **Balanced typography** - Consistent, readable, intentional
5. **Outcome-focused copy** - Clear on what the user gets

**What Separates Professional from "AI Slop":**

| AI Slop | Professional Trust |
|---------|-------------------|
| Extreme border-radius (16px+) | Subtle rounding (4px-8px) - signals precision |
| Vibrant mesh gradients | 2-stop, high-chroma but low-contrast gradients |
| Breaks 8pt grid | Ruthless alignment to baseline grid |
| Dense information with no focus | High density WITH clear islands of focus |

**LLM-Implementable Design Tokens:**

```css
:root {
  /* OKLCH - modern, perceptually uniform color space */
  --color-primary: oklch(65% 0.25 280);    /* Vibrant purple - adjust hue/lch for brand */
  --color-surface: oklch(98% 0.02 280);    /* Near-white */
  --color-text: oklch(20% 0.02 280);       /* Near-black */
  
  /* Functional colors - use semantic names */
  --color-info: oklch(60% 0.15 220);       /* Blue */
  --color-success: oklch(65% 0.15 150);    /* Green */
  --color-warning: oklch(70% 0.15 80);     /* Amber */
  --color-error: oklch(60% 0.18 25);       /* Red */
  
  /* Spacing - 8pt grid */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  
  /* Professional precision */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  
  /* Typography */
  --font-sans: "Geist Sans", system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;
  
  /* Subtle borders and shadows */
  --border-subtle: 1px solid oklch(90% 0.02 280);
  --shadow-sm: 0 1px 2px oklch(0% 0 0 / 0.05);
}
```

**Color Guidelines:**
- **Use OKLCH** for all colors - perceptually uniform, supports dark mode natively, no more guessing hex values
- **Never deviate functional colors** (blue=info, green=success, etc.) for aesthetics
- **Primary accent**: One bold color used sparingly on CTAs
- **Neutrals**: Use slate/zinc scale for grounding, not as main visual element

**When describing to an LLM, use specific constraints:**
- **Spacing**: "Use strict 4px/8px scale. `p-4` (16px) for containers, `gap-2` (8px) for related elements."
- **Typography**: "Set `letter-spacing: -0.02em` for headings. Use `font-feature-settings` for high-legibility."
- **Borders**: "Use `border-width: 1px` with `slate-200`. Avoid heavy shadows - use `shadow-sm` only."
- **Color**: "Primary color needs 4.5:1 contrast ratio. Use 'zinc' neutral palette to ground the accent."

**Strategic Visual Design:**

1. **Color & Contrast**
   - Use strong, high-contrast colors strategically on elements that drive revenue
   - Primary CTAs should "pop off the screen"
   - Secondary actions should fade into the background
   - Reduce contrast on less important content to create visual breathing room

2. **Visual Hierarchy**
   - Every visual choice should answer: "Does this help users see what they need to see when they need to see it?"
   - Use directional elements, color coding, and visual weights to guide users toward conversion
   - Don't cram every feature into view—use strategic whitespace

3. **Storytelling Through Design**
   - Your visuals should guide users naturally through the interface
   - Create a clear path toward your goals
   - Visual elements should lead, not distract

**The misconception**: Interface design is NOT about shiny buttons or fancy gradients. It's a strategic tool that enhances your experience foundation.

**If you skip this layer**: You'll have a great product that nobody trusts enough to try.

**Example:**
| Bad | Good |
|-----|------|
| All elements same visual weight | CTA pops, secondary fades |
| Purple gradient everywhere | Strategic accent on conversion points |
| Cramped, feature-dense | Whitespace breathing room |
| 50 random icons | Intentional, aligned icon system |

---

### Layer 3: Emotional Design Integration

**The principle**: This is what separates merely good apps from addictive ones. In the digital space, you must DESIGN emotional connection or it simply doesn't exist.

**Win Mapping + Peak-End Rule**: Users judge entire experiences by:
1. The most intense moment (the peak)
2. The ending moment (the end)

Ask yourself: Where are the peaks in my app? When are users most satisfied? That's when you ask for upgrades, ratings, shares.

**Why it matters:**
- In person, emotional connection happens naturally through tone, body language, reactions
- In apps, users complete tasks but never form attachment → they churn
- Most apps today treat users like robots who just want efficiency
- Without emotional attachment, users switch to competitors on price alone

**The Emotional Retention Cycle:**

```
Guilt/Fear (return to app) → Relief (completing task) → Celebration (peak) → Satisfaction (end)
                              ↑
                    The Peak-End Rule
```

**Emotions That Drive Retention:**

| Emotion | How to Use | Example |
|---------|-----------|---------|
| **Guilt** | Mascot/personified character that "misses" user | Duolingo's sad Duo when you miss a day |
| **Fear of Loss** | Streak counters, "Don't lose your progress!" | 100-day streak prominently displayed |
| **Relief** | "The Relief Effect" - completing after guilt | Completing lesson after notification |
| **Amusement** | Subversive humor, witty copy | "These reminders don't seem to be working..." |
| **Excitement** | Variable rewards, unexpected celebrations | Random gems after lessons |

**Duolingo-Style Patterns:**

1. **The Distressed Mascot**
   - When user misses a lesson, character appears distressed
   - "Sick Duo", "Melting Duo" - creates emotional contagion
   - User feels compelled to "rescue" the character

2. **Passive-Aggressive Notifications**
   - "These reminders don't seem to be working. We'll stop sending them."
   - Uses reverse psychology - threatens to stop caring
   - Triggers FOMO, desire to prove relationship is valid

3. **The Mercy Mechanic (Streak Freeze)**
   - Allow users to "earn" or "buy" a way to skip without losing streak
   - Mitigates "Abstinence Violation Effect" (one mistake → total abandonment)
   - Turns loss aversion into engagement opportunity

4. **Endowed Progress**
   - Give users a "head start" (e.g., 2 free points)
   - Creates psychological ownership - more likely to finish

5. **Variable Rewards**
   - Random "gems" or rewards after tasks
   - Keeps dopamine loop unpredictable and engaging

**The 2:1 Balance Rule:**
- Two celebrations for every one guilt trip
- Maintain the "high" while using "low" as return trigger
- Don't overdo guilt - leads to UX fatigue and uninstalls

**How to add emotional design strategically:**

1. **Identify high-impact moments (Win Mapping)**
   - Where does emotional integration lead to better business outcomes?
   - Which flows benefit most from human connection?
   - Examples: onboarding, progress milestones, achievements, streak systems

2. **Pattern: Progress Celebration**
   - Duolingo-style: celebrate every lesson completed
   - Visual rewards that make users feel accomplished
   - Create "streak" mechanics that create loss aversion

3. **Pattern: Tiered Achievement Systems**
   - Levels designed to keep power users engaged for years
   - Visual progression that users don't want to lose
   - "Diamond systems" that reward consistent engagement

4. **Pattern: Brand Reinforcement**
   - Pick the most-used part of the app to reinforce branding
   - Create memorable daily interactions
   - Combine functional value with emotional resonance

5. **Pattern: Trust-Building Onboarding**
   - For trust-sensitive audiences, frontload emotional connection
   - Make the first experience feel personal and human
   - Design to earn trust, not assume it

**Implementation: Emotional State Machine**

When describing to an LLM, use state-driven prompting:

> "Act as an Emotional Onboarding Assistant. Maintain `engagement_level` from 1-5.
> - Level 5: Overly bubbly, confetti, celebrate every click
> - Level 2: Short, clipped sentences, express disappointment
> - Level 1: Use 'Breakup Pattern' - suggest user is too busy, offer to delete data"

**If you skip this layer**: You'll have a functional, trustworthy app that users abandon when a better option appears.

**Example:**
| Bad | Good |
|-----|------|
| Empty success state | Confetti + "You crushed it!" |
| Streak hidden | Streak prominently displayed with "Don't lose it!" |
| No onboarding emotion | Human greeting, personalized welcome |
| Random ask timing | Strategic ask AFTER peak moment |
| Generic "Good job!" | Character reacts, feels personal |

---

## Planning Checklist

Use this when planning any interface:

### Experience Foundation
- [ ] What is the ONE core job this interface accomplishes?
- [ ] What is the current user journey (step by step)?
- [ ] Where are the friction points?
- [ ] How can we reduce steps/inputs/time?
- [ ] Have we documented this before touching any design tools?
- [ ] **Competitive Research**: Mapped direct/indirect/aspirational competitors?
- [ ] **Time-to-Value**: How many steps for user to get value?
- [ ] **Friction Sweet Spot**: Too much? Too little? Just right?

### Interface Boosting
- [ ] What is the 50ms trust impression?
- [ ] Where are our primary CTAs? Do they pop?
- [ ] What can we fade into the background?
- [ ] Does visual hierarchy guide users toward conversion?
- [ ] Are we treating design as decoration or strategy?
- [ ] **First 5 Fundamentals**: Clean hierarchy? Generous spacing? Professional imagery? Balanced typography? Outcome-focused copy?
- [ ] **OKLCH Colors**: Using modern color space?
- [ ] **8pt Grid**: Ruthless alignment?
- [ ] **Border Radius**: Subtle (4-8px), not extreme?

### Emotional Design Integration
- [ ] Where in the flow does emotional connection matter most?
- [ ] How do we celebrate user progress?
- [ ] What creates "I can't lose this" feelings?
- [ ] How do we make users feel seen, not just served?
- [ ] What's the thing they'll remember tomorrow?
- [ ] **Win Mapping**: Where are the peaks in our app?
- [ ] **Peak-End Rule**: Asking for upgrades AFTER peak moments?
- [ ] **2:1 Balance**: Two celebrations per guilt trip?
- [ ] **Emotional State**: Using state-driven responses (Level 1-5)?

---

## Design-It-Twice

Before committing to an interface direction, spawn 2-3 sub-agents with **radically different** design constraints:

- Agent 1: "Minimize interaction count — fewest possible taps/clicks to value"
- Agent 2: "Maximize delight/gamification — Duolingo-style emotional engagement"
- Agent 3: "Optimize for power users — keyboard shortcuts, density, speed"

Each agent produces: interface sketch, trade-offs, what it hides internally. Compare results before choosing. Often the best design combines insights from multiple approaches.

**Rule**: If agents produce similar designs, the constraints weren't different enough. Enforce radical divergence.

## Ask vs Explore

- **Explore first**: existing UI patterns, component library, design tokens, competitive landscape, current user flows
- **Ask the user**: user personas, business constraints, brand voice, success metrics, priority trade-offs
- If the codebase can answer it, don't ask

## Anti-Patterns

- **Layer 3 before Layer 1**: Adding emotional design to a broken core experience
- **Copying competitors without understanding why**: Patterns work because of context — blindly copying Duolingo's streaks into a fintech app misses the point
- **Designing for "average users"**: Average users don't exist; design for specific personas with specific jobs
- **Sub-agents producing similar designs**: Enforce radical difference in constraints
- **Skipping the comparison step**: The value of design-it-twice is in the contrast, not the options
- **Over-interviewing the user**: If the codebase or competitive analysis can answer it, explore first
- **Treating Layer 2 as decoration**: Visual design is a trust signal, not aesthetics

---

## Applying This Skill

When invoked, analyze the user's request and:

1. **Identify which layer they're in**
   - Still figuring out the core experience? → Focus on Layer 1
   - Experience works but looks generic? → Focus on Layer 2
   - Need to increase stickiness/retention? → Focus on Layer 3

2. **Ask the right questions**
   - Don't jump to solutions before understanding the problem
   - Challenge assumptions about what users want
   - Look for the "pizza ordering" example—sometimes the best interface is one they never see

3. **Think strategically**
   - Every design decision is a business decision
   - Colors, spacing, animations all drive toward goals
   - Ask: "Does this help users see what they need?"

4. **Remember the order**
   - Layer 1 before Layer 2 before Layer 3
   - You can't interface boost a broken experience
   - You can't add emotion to an untrusted product

---

## Connection to Other Skills

- Use **frontend-design** for the visual execution once strategy is set
- Use **web-animation-design** for implementing emotional moments and transitions
- Use **interface-strategy** FIRST to ensure you're building the right thing

The best products are built in this order:
1. Strategy (this skill)
2. Experience Foundation
3. Interface Boosting  
4. Emotional Design Integration
5. Execution (frontend-design, web-animation-design)

---

## Deterministic Execution

### Using the Planner Script

Generate a complete interface strategy document programmatically:

```bash
# Interactive mode - answers questions and generates SPEC.md
python scripts/interface-planner.py --interactive

# From existing notes
python scripts/interface-planner.py --input notes.md --output SPEC.md

# Validate existing strategy
python scripts/checklist-validator.py --spec path/to/SPEC.md
```

### Using Spec Kit (GitHub)

Initialize for Spec-Driven Development:

```bash
# Install specify CLI
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

# Initialize project
specify init my-project --ai claude

# Then use these commands in conversation:
# /speckit.specify - generate SPEC.md from conversation
# /speckit.plan - create implementation plan
# /speckit.tasks - break into actionable tasks
```

---

## Resources

- [references/checklist.md](references/checklist.md) - Printable planning checklist
- [references/examples.md](references/examples.md) - Real-world case studies
- [references/research.md](references/research.md) - 110+ sources (academic, Duolingo, LLM, psychology)
- [scripts/interface-planner.py](scripts/interface-planner.py) - Deterministic document generator
- [scripts/checklist-validator.py](scripts/checklist-validator.py) - Strategy completeness validator
