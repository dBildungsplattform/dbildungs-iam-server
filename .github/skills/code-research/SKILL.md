---
name: code-research
description: 'Answer architecture and code-path questions by tracing the codebase and explaining how behavior works. Use when user asks things like "How does the logic process work in the server?", "How does the email suspending work in server?", "Where is X implemented?", "Trace Y through the backend", or "Explain the architecture for Z".'
---

# Code Research

## Purpose
Produce an evidence-backed explanation that:
1. answers the user's architecture or behavior question directly,
2. traces the controlling code path instead of summarizing only wiring,
3. separates confirmed facts from unknowns,
4. gives the reader exact places to continue debugging or changing the behavior.

## Workflow Rules

### Always do
1. Restate the research question in one sentence.
2. Start from the most concrete anchor in the question:
   - controller or route,
   - service or use case,
   - event handler or consumer,
   - cron, job, or queue worker,
   - repository,
   - mailer or template,
   - test covering the behavior.
3. Inspect only enough nearby code to trace the controlling path end to end:
   - entry point,
   - orchestration or service layer,
   - domain rules and permission checks,
   - persistence or external integrations,
   - emitted events and side effects,
   - error handling and configuration.
4. Prefer the code that makes decisions over modules that only wire dependencies.
5. Look for:
   - similar flows,
   - DTOs, contracts, schemas,
   - guards and permissions,
   - config or env flags,
   - tests that confirm behavior,
   - docs only as supporting evidence after code.
6. Distinguish:
   - confirmed from code,
   - inferred but not proven,
   - unresolved.
7. If the question is ambiguous, ask the minimum clarifying question needed to identify the target flow.
8. Produce the final answer in the required output format.

### Ask first
1. Ask before answering if:
   - the request could refer to multiple independent server flows,
   - the user says "the logic process" or similarly broad wording with no subsystem named,
   - a term maps to multiple modules or entities in the repo.
2. Ask a narrow disambiguation question instead of exploring the whole codebase.

### Never do
1. Do not invent behavior not evidenced in code.
2. Do not answer architecture questions from docs alone if code is available.
3. Do not map the entire system when the user asked about one flow.
4. Do not hide uncertainty; mark gaps explicitly.
5. Do not mix speculation with confirmed control flow.
6. Do not propose implementation plans unless the user asks for changes.

## Tracing Procedure

For each question:
1. Create an **Initial Understanding** section.
2. Identify the best anchor and inspect the nearest controlling abstraction.
3. Trace one hop at a time through the behavior:
   - caller or entry point,
   - orchestrator or domain service,
   - repositories or integrations,
   - downstream side effects.
4. Capture evidence in:
   - relevant files or modules,
   - step-by-step flow,
   - configuration, permissions, and errors,
   - tests or examples.
5. Record unknowns in an **Open Questions Register**.
6. Answer the user's question directly before adding supporting detail.

### 1. Objective
- one-line restatement of the question being answered
- confidence level

### 2. Evidence
- relevant files or modules (table, file or module, why it is relevant)
- controlling path (ordered list or table of entry point -> orchestrator -> dependencies -> side effects)
- similar implementations or neighboring flows
- tests, config, contracts, and docs found

### 3. Answer
- short direct answer first
- step-by-step flow
- key decision points, permission checks, data transformations, and side effects
- error handling or fallback behavior when relevant

### 4. Open Questions and Unknowns
Output the following as a table:
- blocker or non-blocker
- question or gap
- current status
- next best source or owner

### 5. Next Checks
- optional follow-up reads, tests, or runtime checks that would further confirm behavior
- mention the most likely edit points if the user wants to change the behavior next

## Quality Bar
Final answer must be useful to:
- an engineer trying to understand the current behavior,
- an engineer trying to debug where the behavior breaks,
- an engineer deciding where a future change should be made.