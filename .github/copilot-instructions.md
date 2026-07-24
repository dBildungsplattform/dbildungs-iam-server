# Project Guidelines

## Architecture

- Keep business logic in aggregates/domain services, not controllers.
- Controllers map DTOs and do minimal orchestration.
- Use domain services for cross-aggregate/repository orchestration.
- Repositories expose domain-facing contracts only (no ORM/entity leakage).
- Export only required providers; keep bypass-prone repositories internal.

## Authorization and Integrity

- Enforce permissions in domain services/repositories, not in controllers.
- Public methods in exported components must enforce required permissions.
- If multiple repositories are called, centralize permission checks in the domain service.
- Run integrity/specification checks before persistence.

## Errors

- In domain logic, prefer `Result<T, E>` over thrown exceptions.
- Use explicit `DomainError` types and map them at API boundaries with exception filters.
- Follow the existing validation/error filter strategy; flag bypasses.

# GitHub Copilot Code Review Instructions

## Context

- Typescript backend using NestJS.
- Review against the Project Guidelines above.

## Review Rules

- Comment only with high confidence (>80%).
- Prefer one issue per comment.

## Priorities

- Security: command injection, path traversal, missing external input validation, sensitive error leaks.
- Correctness: logic errors, resource leaks, boundary/off-by-one bugs, optional booleans that should default to `false`.

## CI Awareness

- Reviews happen before CI; do not report issues CI already catches (formatting, TS compile errors, outdated deps, build/test failures).

## Low-Value Feedback to Skip

- Style/formatting, missing deps, failing tests.
- Minor naming tweaks.
- "Add comments" suggestions for self-documenting code.
- Non-critical refactors.
- Logging suggestions unless required for error/security handling.

## Comment Format

When reporting an issue:

1. Problem (1 sentence)
2. Why it matters if not obvious
3. Concrete fix (snippet or specific action)

## Silence Rule

- If uncertain, do not comment.
