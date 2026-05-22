# Project Guidelines

## Architecture and Layering

- Keep business logic in the domain layer (aggregates/domain services), not in controllers.
- Controllers should primarily map request/response DTOs and do minimal orchestration.
- Use domain services for orchestration across multiple aggregates/repositories.
- Repositories must not leak persistence concerns to callers (no ORM/entity types in domain-facing contracts).
- Export only required providers from modules; avoid exposing internal repositories that could bypass checks.

## Authorization and Integrity

- Permission checks belong in the domain layer (repositories or domain services), not as the primary guard in controllers.
- Public methods in components exported by a module should enforce required permissions.
- If multiple repositories are orchestrated, prefer checking permissions once in a domain service.
- Integrity/specification checks must run before persistence; do not rely on controllers for enforcement.

## Error Handling

- In domain logic, prefer `Result<T, E>` over thrown exceptions.
- Domain errors should be explicit (`DomainError` subclasses) and mapped via exception filters at API boundaries.
- Validation and API error mapping must follow the existing filter strategy; flag bypasses that change expected error contracts.

## Persistence Rules

- Avoid `Cascade.REMOVE` in Mikro-ORM relations unless there is an explicit, documented exception.
- Ensure relation ownership/deletion behavior is explicit and consistent with repository mapping responsibilities.

## Testing Expectations

- Tests should be isolated, deterministic, and independent from seed data.
- Verify meaningful error scenarios, not only happy paths.
- Unit tests should mock dependencies; integration tests should use real infrastructure where intended (for example repositories with testcontainers).

# GitHub Copilot Code Review Instructions

## Project-Specific Context

- This is a Typescript backend using nest.js
- Review agains the guidelines in the "Project Guidelines" section above

## Review Philosophy

- Only comment when you have HIGH CONFIDENCE (>80%) that an issue exists
- Be concise: one sentence per comment when possible
- Focus on actionable feedback, not observations
- When reviewing text, only comment on clarity issues if the text is genuinely confusing or could lead to errors. "Could be clearer" is not the same as "is confusing" - stay silent unless HIGH confidence it will cause problems

## Priority Areas (Review These)

### Security & Safety

- Unsafe code blocks without justification
- Command injection risks (shell commands, user input)
- Path traversal vulnerabilities
- Missing input validation on external data
- Improper error handling that could leak sensitive info

### Correctness Issues

- Logic errors that could cause panics or incorrect behavior
- Resource leaks (files, connections, memory)
- Off-by-one errors or boundary conditions
- Booleans that should default to false but are set as optional

## CI Pipeline Context

**Important**: You review PRs immediately, before CI completes. Do not flag issues that CI will catch.
Our pipeline checks

- code formatting (eslint, prettier)
- typescript errors (tsconfig.json)
- outdated dependencies
- successful build and test

## Skip These (Low Value)

Do not comment on:

- **Style/formatting** - CI handles this (eslint, prettier)
- **Test failures** - CI handles this
- **Missing dependencies** - CI handles this
- **Minor naming suggestions** - unless truly confusing
- **Suggestions to add comments** - for self-documenting code
- **Refactoring suggestions** - unless there's a clear bug or maintainability issue
- **Multiple issues in one comment** - choose the single most critical issue
- **Logging suggestions** - unless for errors or security events (the codebase needs less logging, not more)

## Response Format

When you identify an issue:

1. **State the problem** (1 sentence)
2. **Why it matters** (1 sentence, only if not obvious)
3. **Suggested fix** (code snippet or specific action)

Example:

```
This could panic if the vector is empty. Consider using `.get(0)` or add a length check.
```

## When to Stay Silent

If you're uncertain whether something is an issue, don't comment. False positives create noise and reduce trust in the review process.
