# Interface Strategy Examples

Real-world case studies applying the three-layer framework.

---

## Example 1: Food Delivery App

### Layer 1: Experience Foundation
- **Bad**: 5 screens to order pizza
- **Good**: 2 taps, predicted address, one-click reorder
- **Why**: Core job is "food on table", not "using an app"
- **Competitive**: Mapped DoorDash, UberEats - found 4-step checkout weakness

### Layer 2: Interface Boosting
- **Bad**: All buttons same color
- **Good**: "Order Now" pops in orange, "View Menu" fades
- **Why**: 50ms trust test - professional = reliable
- **OKLCH**: `oklch(70% 0.15 25)` for CTA, `oklch(95% 0.02 280)` for background

### Layer 3: Emotional Design
- **Bad**: Transactional confirmation
- **Good**: "Your driver is 2 mins away" with driver photo
- **Why**: Human connection in digital transaction
- **Win Map**: Peak moment = order confirmed → ask for rating THEN

---

## Example 2: Learning App (Duolingo-style)

### Layer 1: Experience Foundation
- **Bad**: 10-minute lesson
- **Good**: 2-minute bite-sized lessons
- **Why**: Fits into daily routine
- **Competitive**: Analyzed Duolingo, Babbel - found 5-min barrier

### Layer 2: Interface Boosting
- **Bad**: Boring quiz UI
- **Good**: Game-like, bold colors, progress bars
- **Why**: Signals fun, not work
- **8pt Grid**: Strict alignment, consistent spacing

### Layer 3: Emotional Design
- **Bad**: Just lessons
- **Good**: Streaks, leagues, celebrations, guilt for missing days
- **Why**: Loss aversion + social pressure = habit
- **Mascot**: Distressed Duo when streak at risk
- **2:1 Balance**: 2 celebrations per guilt trip

---

## Example 3: Fintech App (Trust-Sensitive)

### Layer 1: Experience Foundation
- **Bad**: Complex investment options upfront
- **Good**: Simple savings first, complexity later
- **Why**: Trust is the core job

### Layer 2: Interface Boosting
- **Bad**: Playful, casual design
- **Good**: Professional, institutional feel
- **Why**: Signals security, competence
- **OKLCH**: `oklch(25% 0.02 220)` dark blue for trust
- **Border Radius**: 4px (not 16px) = precision signal

### Layer 3: Emotional Design
- **Bad**: Just numbers
- **Good**: "You saved $X this month", milestone celebrations
- **Why**: Personal progress = trust reinforcement
- **Peak-End**: Celebrate savings milestone, THEN ask for referral

---

## Example 4: Productivity App

### Layer 1: Experience Foundation
- **Bad**: Feature-rich but confusing
- **Good**: Three actions max to完成任务
- **Why**: Speed > features
- **Friction Sweet Spot**: Not too simple (confusing), not too complex (overwhelming)

### Layer 2: Interface Boosting
- **Bad**: Dense, information overload
- **Good**: White space, one primary action
- **Why**: Clarity = efficiency
- **Hierarchy**: Center-out pattern for actions

### Layer 3: Emotional Design
- **Bad**: Just a tool
- **Good**: Daily streak, weekly goals, achievement badges
- **Why**: Routine formation

---

## Example 5: AI Transcription App

### Layer 1: Experience Foundation
- **Core Job**: "Get accurate transcription with zero friction"
- **Competitive**: Compared to Otter.ai, Rev - found latency weakness

### Layer 2: Interface Boosting
- **Audio Waves**: Visual feedback makes AI feel "alive"
- **OKLCH**: `oklch(65% 0.2 280)` purple accent
- **Trust**: Show confidence score (89% match) = transparency

### Layer 3: Emotional Design
- **Variable Rewards**: Random "gems" after transcriptions
- **Endowed Progress**: Give 50% progress on upload
- **Mascot**: Emotional reactions to completion

---

## Pattern Summary

| Pattern | Layer | Example |
|---------|-------|---------|
| Reduce friction | 1 | Fewer taps, predicted input |
| Speed as feature | 1 | Instant feedback |
| Competitive mapping | 1 | Find competitor weaknesses |
| Friction sweet spot | 1 | Not too much, not too little |
| Visual hierarchy | 2 | CTA pops, rest fades |
| OKLCH colors | 2 | Modern, perceptually uniform |
| 8pt grid | 2 | Ruthless alignment |
| Border radius 4-8px | 2 | Precision signal |
| Progress celebration | 3 | Confetti, milestones |
| Streak mechanics | 3 | Loss aversion |
| Mascot emotions | 3 | Distressed character |
| Win mapping | 3 | Ask AFTER peak |
| 2:1 balance | 3 | 2 celebrations per guilt |
