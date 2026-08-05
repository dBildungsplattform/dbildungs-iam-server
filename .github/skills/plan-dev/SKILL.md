---
name: plan-dev
description: Build an execution-ready dev plan by inspecting codebase first, resolving ambiguity from code/docs, then asking user questions for every unresolved item. Use when user wants to plan development tasks.
---

# Dev Task Planner

## Purpose
Produce a plan that is:
1. grounded in codebase evidence,
2. explicit about unknowns and user-confirmed assumptions,
3. executable by humans and agents,
4. bounded by clear scope and acceptance criteria.

## Workflow Rules

### Always do
1. Start by restating the requested outcome in one sentence.
2. Inspect the codebase before asking clarifying questions.
3. Check:
   - similar implementations,
   - entry points and affected modules,
   - interfaces/schemas/DTOs/contracts,
   - tests and test patterns,
   - feature flags/config/env dependencies,
   - architecture constraints and conventions.
4. Build uncertainty list:
   - resolved from codebase,
   - unresolved non-blocking,
   - unresolved blocking.
5. For every unresolved item, ask the user. Each question should include:
   - why it matters,
   - what was checked in the codebase,
   - why codebase evidence was insufficient,
   - answer options, if possible.
6. Repeat clarify -> inspect -> refine until planning-ready.
7. Produce final plan in required output format.

### Ask first
1. Ask before proposing:
   - new dependencies,
   - schema changes,
   - public API contract changes,
   - auth/permission changes,
   - infra/config changes,
   - destructive migrations,
   - cross-team interface changes.
2. Ask before work outside directly affected area if blast radius materially increases.

### Never do
1. Do not start implementation while requirements are ambiguous.
2. Do not invent libraries/services/files/architecture not evidenced in repo or explicitly requested.
3. Do not assume unclear user-visible behavior.
4. Do not convert unresolved questions into assumptions.
5. Do not leave acceptance criteria subjective.
6. Do not omit out-of-scope items.

## Clarification Loop

For each task:
1. Create an **Initial Understanding** section.
2. Explore the codebase and collect evidence.
3. Populate an **Open Questions Register**:
   - question
   - blocking/non-blocking
   - evidence checked
   - likely options
   - no default behavior without user answer
4. Ask user every unresolved question. One at a time.
5. After answers, re-check relevant code.
6. Repeat until planning-ready.

## Planning Readiness Criteria
Do not finalize until all are true:
- Goal is specific and testable.
- Affected areas of the codebase are identified.
- Interfaces/contracts are known or explicitly flagged.
- Constraints and non-goals are listed.
- Risks and user-confirmed assumptions are visible.
- Acceptance criteria are concrete.
- There are no unresolved questions.

## Required Output Format

See [example.md](example.md) for a complete mock example in the required format.

### 1. Objective
- one-line desired outcome
- confidence level

### 2. Evidence
- relevant files/modules (table, file/module, why it is relevant)
- similar implementations (table, file/module, why it is relevant)
- existing patterns to follow
- tests/config/contracts found

### 3. Questions and Answers
Output the following as a table:
- blocker/non-blocker
- question
- answer/status
- owner if deferred

### 4. Additional Decisions and Risks
- additional decisions confirmed with user beyond Q&A section
- key risks and mitigations
- alternatives considered

### 5. Plan
Output a numbered list. Use headings to distinguish individual steps. For each step include:
- step number
- objective
- files/components likely affected
- dependencies/prerequisites
- expected output artifact
- acceptance criteria
- validation method (a list of checkboxes, with the options unit test, integration test, manual test, custom test script, check the options that should be used)

## Quality Bar
Final plan must be executable by:
- a human engineer working cold,
- an implementation agent with repo access,
- a reviewer verifying completion against the plan.
