# E2E Test Issues

## Status
Test fixed to classify differences correctly. Test now fails due to bugs in corrections, not test logic.

## Key Findings

### Test Logic (CORRECT)
- Test now correctly classifies differences:
  - Flagged unclear: 21 items (gaps to fill)
  - Wrong replacements: 17 items (bugs in corrections)
- Test correctly fails on wrong replacements

### Bugs Found in Corrections
1. **Windsurf/Windsurf** (Line 34): Raw has "IntSurf/Windsurf", correction replaces "IntSurf" → "Windsurf", result is "Windsurf/Windsurf" but ground truth expects "Windsurf e Claude"
   - Root cause: Correction doesn't account for existing "Windsurf" after slash
   - Impact: Creates duplicate word

2. **Logo → Lovable** (Line 219): Context rule requires specific neighbors, but they're not present
   - Correctly flagged as unclear
   - Ground truth expects "Lovable" but toolkit can't deterministically replace

3. **Other wrong replacements**: Similar issues where corrections create unexpected changes

## Next Steps
- Corrections need review/fix (not in scope of this task)
- Test is working correctly - it identifies bugs in corrections
- Test passes for flagged unclear items (expected gaps)
