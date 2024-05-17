# Architecture

## Domain Driven Design

We follow the principles of domain driven design.<br>
Business logic is handled in the domain layer.

Business logic is mainly handled within an Aggregate. If that is not possible, e.g. because an operation affects multiple aggregates a Domain Service is used.<br>
A new Aggregate is created by a factory.<br>
To load an Aggregate from the persistence layer a Repository is used.<br>
A changed Aggregate is persisted via a Repository as well.<br>
A Repository shall not expose any data structures related to the persistence layer i.e. DB-entities or ORM related classes or types.
A Repository should not provide multi purpose methods. If an Aggregate or controller needs to search with specific parameters we create a method just for these specific parameters.

For cross cutting concerns we use Shared Services. Shared services can be injected into Aggregates.

To expose an API we use Controllers. Controllers call Aggregates and Domain Services. The expose DTOs with Decorators to generate the OpenApi Specification.

The following diagram shows the class structure and how to create (1a, 2a, 3, 4) or how to edit (1b, 2b, 3, 4) data.
![Class Structure](./img/class-structure.v2.svg "Source of draw.io diagram is embedded in the file")

Old modules still follow the class structure as it was defined in dBildungscloud.

![Deprecated Class Structure](./img/deprectated-class-structure.v1.svg "Source of draw.io diagram is embedded in the file")

## Modules

A module contains a cohesive portion of the domain. <br>

A module can contain both services for internal use only and services that are meant to be consumed by other modules.
Decide what services to put in the module's `exports`-array instead of defaulting to export everything "just in case".

## Authorization

Authorization is done in the Domain Layer, practically the Aggregates. If a service triggers operations in multiple Aggregates, each Aggregate will need to perform its own check. A users roles and rights should be cached in the request context to not retrieve them for each check.

The services do not check the user rights again to avoid code duplication. Even services that are exported from a module rely on the authorization being checked by the calling use cases.
We do not rely on authorization checks in the controllers.

## Integrity Checks

We need check conditions for data integrity e.g. a class (Klasse) can not be administrated by a school sponsor (Schulträger), but only by a school.
To check these conditions we use the specification pattern for reusability.
An Aggregate can run its own Specifications. This an be done while creating the Aggregate.

Before persisting an aggregate the Specifications need to be checked. The Repository must trigger the check. We do not rely on the controller.

