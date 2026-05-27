# Post-Commit Hook

**Purpose**: Record session memory after commits.
**Trigger**: `git commit`

## Actions
1. Update `MEMORY.md` with commit summary
2. Record architecture decisions if commit includes ADR
3. Log lessons learned if commit includes spec changes

## Quick Reference
```bash
# Update memory
echo "- $(date +%Y-%m-%d): $(git log -1 --pretty=%s)" >> MEMORY.md
```
