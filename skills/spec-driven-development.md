# Skill: Spec-Driven Development

**Description**: Implement new features following the spec-driven development workflow.
**Version**: 1.0.0
**Category**: Development

## Trigger
When a user requests a new feature or significant change.

## Instructions

### Step 1: Create Feature Spec
1. Run `.specify/scripts/create-feature.sh "Feature Name"` or manually create `specs/<feature-name>/spec.md`
2. Define user stories and acceptance criteria
3. Identify edge cases
4. Review checklist in spec template

### Step 2: Clarify
1. Review spec for ambiguity
2. Ask questions about underspecified areas
3. Record clarifications in spec's Clarifications section

### Step 3: Plan
1. Create `plan.md` with tech stack decisions, architecture changes, data model changes
2. Document API changes and event changes
3. Consider security, performance, and migration
4. Research any uncertain tech stack choices

### Step 4: Task Breakdown
1. Create `tasks.md` with phased task list
2. Define dependencies between tasks
3. Mark parallel-executable tasks with [P]
4. Include test tasks for each phase

### Step 5: Implement
1. Follow tasks in order, respecting dependencies
2. Run parallel tasks concurrently
3. Verify each task against its acceptance criteria
4. Commit after each complete phase

### Step 6: Review
1. Run Reviewer Agent against all new code
2. Fix all BLOCKER and MAJOR items
3. Run full test suite
4. Document lessons learned

## Validation
- [ ] Spec exists in `specs/<feature-name>/spec.md`
- [ ] All acceptance criteria met
- [ ] All BLOCKER review items resolved
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Lessons recorded in `docs/improvements/lessons-learned.md`
