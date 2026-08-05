---
name: tdd-loop
description: 'Run a test-driven development loop for features, bug fixes, and refactors. Use when tdd, test-driven development or red-green are mentioned.'
argument-hint: 'Describe goal, bug, or feature to drive with TDD'
---

# TDD Loop

Drive work in short red -> green -> refactor cycles.

## Core Rules

- Do not assume unclear behavior
- Ask user questions for every unresolved requirement
- Provide answer options when possible
- Keep iterating autonomously until done or blocked
- Prefer one failing test at a time
- Prefer existing repo test layer first; if none is clear, pick the smallest fast test that can prove behavior
- Prefer smallest code change that makes current test pass
- After first substantive edit, run focused validation before more edits
- Prefer running checks through a workspace task when available; otherwise run the narrowest direct command
- Do not widen scope unless current loop is complete or blocked

## Loop

The core idea behind TDD is to create the minimal failing test for a behavior, then make the smallest change to pass that test, and finally refactor while keeping the test passing. Repeat this process until the desired behavior is fully implemented and validated.

1. Restate target behavior in one sentence.
2. Inspect nearest code, tests, and call sites to find the controlling behavior.
3. Identify one falsifiable next check:
   - existing failing test in current test layer,
   - new narrow test in that same layer,
   - smallest fast test if no clear layer exists,
   - custom test script to validate behavior
4. If any requirement is unresolved, ask user before planning or coding. For each question include:
   - why it matters,
   - what code or tests were checked,
   - why that evidence was insufficient,
   - answer options, if possible.
5. Make or update one narrow test that should fail for the target behavior. Update should be the smallest change to get the test back to failing.
6. Run the narrowest validation that can fail on that behavior.
7. Make the smallest production change needed to pass that check.
8. Rerun the same focused validation immediately.
9. If green, refactor only within touched area while keeping behavior fixed.
10. Rerun focused validation after refactor. Include code quality checks if available (lint, type check, formatting, etc.).
11. Repeat autonomously until acceptance criteria are satisfied or a real blocker appears.

## Decision Rules

- If the first test passes unexpectedly -> inspect one nearby control point, then tighten or replace the test.
- If the first validation fails for the expected reason -> fix that same slice, then rerun the same validation.
- If the first validation fails for a different reason -> step one hop toward the controlling code, then continue the loop.
- If the change needs new dependencies, schema changes, public API changes, auth changes, infra changes, destructive migrations, or materially wider blast radius -> ask user first.
- If no focused automated check exists -> use a custom test script or the narrowest available compile, lint, or diff-based verification and state that limitation.

## Quality Bar

- Each iteration of the loop has a visible red check and green check
- Tests describe behavior, not implementation detail
- Aim for full coverage.
- Production changes stay minimal and local to current failing behavior

## Done When

- target behavior is covered by tests or the best available focused validation
- current failing behavior is fixed
- touched tests and code pass relevant focused checks
- unresolved questions are answered by the user
- no broader follow-up is hidden inside current change
