# Skill: Agent Onboarding

**Description**: Onboard a new agent into the GardenVerse ecosystem.
**Version**: 1.0.0
**Category**: Development

## Trigger
When adding a new specialized agent to the system.

## Instructions

### Step 1: Define Agent Identity
1. Add `AgentName` enum entry in `packages/backend/src/agents/types/agent.types.ts`
2. Create agent directory in `.agents/<agent-name>/agent.md`
3. Define agent's role, purpose, responsibilities, domain knowledge

### Step 2: Create Agent Service
1. Create `packages/backend/src/agents/<agent-name>/<agent-name>-agent.service.ts`
2. Extend `BaseAgent` class
3. Implement `onEvent()` method with event type routing
4. Define `eventSubscriptions` and `eventEmissions`

### Step 3: Register Agent
1. Add agent config to `AGENT_CONFIGS` in `types/agent.types.ts`
2. Add agent to `agent.module.ts` providers
3. Add agent exports if used by controllers

### Step 4: Wire Events
1. Add event type subscribers in `agent-orchestrator.service.ts` `findSubscribers()`
2. Add event payload type in `types/event-payloads.ts`
3. Emit events from existing services where appropriate

### Step 5: Add Skills
1. Create skill definition in `skills/<agent-name>-workflow.md`
2. Document agent-specific procedures and best practices

### Step 6: Test
1. Unit tests for agent business logic
2. Integration test for event consumption
3. Verify health check endpoint works

## Validation
- [ ] Agent registered and visible in orchestrator
- [ ] Agent subscribes to correct event types
- [ ] Agent emits correct event types
- [ ] Agent health check returns valid status
- [ ] Agent handles errors gracefully
- [ ] Agent defined in `.agents/` with documentation
