# Architecture

## Domain Driven Design

We follow the principles of domain driven design.<br>
**Business logic is handled in the domain layer.**

### Aggregates, Factories, Repositories ###
Business logic is mainly handled within an *aggregate*. If that is not possible, e.g. because a domain operation affects multiple *aggregates* a domain *service* is used.<br>

A new instance of an *aggregate* is created by a *factory*.<br>
To load an instance of an*aggregate* from the persistence layer a *repository* is used. Internally the *repository* loads the data and uses the *factory* to construct the *aggregate*.<br>
A changed or newly created *aggregate* is persisted via a *repository*.<br>

For cross cutting concerns we use shared *services*. *Aggregates* are constructed by *factories*, thus Nest.js can not inject *services* directly into the *aggregates*. We need to inject dependencies of an *aggregate* into the *factory* and hand them over during construction.

### Controllers ###

To expose an API we use *controllers*. *Controllers* call *aggregates* and domain *services*. They expose *DTOs* with Decorators to generate the OpenApi Specification.

The *controller* can call multiple aggregates to collect all data necessary e.g. get a Personenkontext and than call the RolleRepo to get the roles name.

The *controller* checks that parameters have the correct structure, but they do not perform consistency checks or specifactions. Specifications are checked by the *aggregate* itself, if only the *aggregate* itself is concerned, otherwise the *repository* checks before persisting.

### Diagram ###
The following diagram shows the class structure and how to create (1a, 2a, 3, 4) or how to edit (1b, 2b, 3, 4) data.
![Class Structure](./img/class-structure.v2.svg "Source of draw.io diagram is embedded in the file")

<details>
<summary>Deprecated code structure</summary>
Old modules still follow the class structure as it was defined in dBildungscloud.

![Deprecated Class Structure](./img/deprectated-class-structure.v1.svg "Source of draw.io diagram is embedded in the file")
</details>

## Modules

A *module* contains a cohesive portion of the domain. <br>

A *module* can contain both injectables for internal use only and injectables that are meant to be consumed by other modules.
Decide what injectables to put in the *module's* `exports`-array instead of defaulting to export everything "just in case".

## Authorization

Authorization is done in the *aggregates*.<br>
We are planning to create a shared *service* that handles the check based on the user's Personenkontexts (that contain the user's roles and rights) and the rights necessary to perform an operation.

If a service triggers operations in multiple *aggregates*, each *aggregate* will need to perform its own check. A user's roles and rights should be cached in the request context to not retrieve them for each check.
The services do not check the user rights again to avoid code duplication.
