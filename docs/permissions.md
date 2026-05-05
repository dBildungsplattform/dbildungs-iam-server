# Permission Management

## Overview

Permissions are represented as objects that implement the [`IPersonPermissions`](/src/shared/permissions/person-permissions.interface.ts) interface. Every service method or repository that requires authorization receives a `IPersonPermissions` object as a parameter. There are two concrete implementations:

| Class | When to use |
|---|---|
| [`PersonPermissions`](/src/modules/authentication/domain/person-permissions.ts) | Standard case - represents the permissions of the currently authenticated user. |
| [`EscalatedPersonPermissions`](/src/modules/permission/escalated-person-permissions.ts) | Special case - represents a user whose permissions have been temporarily elevated beyond what their Personenkontexte grant, or a artifical Permission Object e.g. for cronejobs or event handlers|

---

## IPersonPermissions Interface

The interface defines the contract for all permission objects:

```ts
export type IPersonPermissions = {...};
```

## PersonPermissions

`PersonPermissions` is created during request authentication and reflects what a real logged-in user is actually allowed to do.

It is injected into controllers via the `@Permissions()` decorator and passed down to domain services and repositories.

## EscalatedPersonPermissions

`EscalatedPersonPermissions` is used when a process needs to act **on behalf of a person** with additional rights that the person does not normally hold, or when a system process (e.g. a cron job or an event handler) needs to perform permission-checked operations without a real logged-in user.

It holds an internal map of `orgaId → systemrechte | 'ALL'` that is populated at construction time and cannot be changed through normal Personenkontext logic. The special sentinel value `'ALL'` means the object holds every possible Systemrecht at that organisation.

> **Security note:** `EscalatedPersonPermissions` must only be created for well-defined, intentional escalation scenarios.

## Choosing the right implementation

```sql
Incoming Request
        │
        ▼
  PersonPermissions  ──► sufficient? ──► use directly
        │
        │ needs additional rights for this operation?
        ▼
  EscalatedPersonPermissionsFactory.fromPermissions(...)
        │
        ▼
  EscalatedPersonPermissions


No real user (cron, event handler)?
        │
        ▼
  EscalatedPersonPermissionsFactory.createNew(...)
        │
        ▼
  EscalatedPersonPermissions
```

---

## Module setup

The `PermissionModule` is declared `@Global()` and exports `EscalatedPersonPermissionsFactory`. Any module that needs to create escalated permissions only needs to inject the factory — no explicit import of `PermissionModule` is required.
