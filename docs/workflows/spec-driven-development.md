# Spec-Driven Development Workflow

## Overview
Every new feature in GardenVerse follows the Spec-Driven Development (SDD) methodology. This ensures we build the right thing, the right way, with clear acceptance criteria and traceability from requirements to code.

## Workflow Diagram
```
User Request
    │
    ▼
┌─────────────────┐
│  /specify.specify│  Write functional spec (what & why)
│  specs/<name>/   │  No tech stack decisions yet
│  spec.md         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  /specify.clarify│  Resolve ambiguity
│                  │  Record Q&A in spec
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  /specify.plan   │  Tech stack, architecture, data model
│  plan.md         │  API contracts, security review
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  /specify.tasks  │  Break plan into actionable tasks
│  tasks.md        │  Dependencies, parallel markers
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  /specify.implement│  Execute tasks in order
│                  │  Test each phase
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  /specify.review │  Code review, security audit
│                  │  Update docs, record lessons
└─────────────────┘
```

## Artifacts
Each feature produces:
```
specs/<feature-name>/
  spec.md         # Functional specification
  plan.md         # Technical implementation plan
  tasks.md        # Task breakdown
  contracts/      # API contracts (if applicable)
    api-spec.json
  research.md     # Research findings (if applicable)
```

## Roles
- **Product Owner**: Defines the "what" and "why"
- **Architect Agent**: Makes technical decisions
- **Implementation Agent**: Writes code
- **Reviewer Agent**: Validates quality and security

## Quality Gates
Before moving from one phase to the next:
- **Spec → Clarify**: All user stories complete, acceptance criteria defined
- **Clarify → Plan**: All ambiguities resolved, edge cases documented
- **Plan → Tasks**: Architecture reviewed, security considered
- **Tasks → Implement**: Dependencies defined, parallel tasks identified
- **Implement → Review**: All tests pass, code compiles
- **Review → Done**: All blockers resolved, docs updated, lessons recorded
