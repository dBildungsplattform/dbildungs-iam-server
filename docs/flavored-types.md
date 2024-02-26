# Flavored types

This document explains the advantages of flavored/branded types and how to use them.

## What are flavored types

Flavored types allow differentiating between equal types.
They are purely part of the type-system and do not contain any runtime information.

You may have a function that takes multiple different IDs as parameters, but you can accidentally pass them in the wrong order:
```typescript
function findUser(userId: string, schoolId: string): User {
    // [...]
}

type SearchParams: {
    userId: string;
    schoolId: string;
};

const params: SearchParams = { /*...*/ }
findUser(searchParams.userId, searchParams.schoolId);

// This would not throw an error
findUser(searchParams.schoolId, searchParams.userId);
```

By using flavored types you can make sure the right arguments get passed:
```typescript
type UserID = Flavor<string, "user">;
type SchoolID = Flavor<string, "school">;

function findUser(userId: UserID, schoolId: SchoolID): User {
    // [...]
}

type SearchParams: {
    userId: UserID;
    schoolId: SchoolID;
};

const params: SearchParams = { /*...*/ }
findUser(searchParams.userId, searchParams.schoolId);

// Error: Argument of type 'SchoolID' is not assignable to parameter of type 'UserID'.
findUser(searchParams.schoolId, searchParams.userId);
```

## How do they work

Typescript is a duck-typed language, so any types that are internally the same will be treated as the same. This means, you can not create unique type-aliases like in other languages.

Flavored types work by creating a union of the actual type and an imaginary object with type discriminator.
A simplified example:

```typescript
type SimpleFlavor = string & { discriminator?: "simple" };
```

We use a unique symbol as the discriminator key, to make the discriminator impossible to access.

## How to create/use them

We have helper-types in [src/shared/types/flavored-types.ts](/src/shared/types/flavored-types.ts)

You can create flavored/branded types like this:
```typescript
type UserIDFlavor = Flavor<string, "user">;
type UserIDBrand = Brand<string, "user">;
```

The first argument is the actual type to be flavored/branded, the second argument is the discriminator.

If you want to make sure the types can not be constructed elsewere, declare a unique symbol that is not exported.

```typescript
declare const userSymbol: unique symbol;
export type UserID = Flavor<string, typeof userSymbol>;
```

### Important caveats

When you use flavored types in places where types are processed by a compiler (e.g. NestJS params/responses, Swagger decorators, entities) you need to explicitly define the type so these tools do not get confused.

```typescript
class SearchParams {
    @IsString()
    @ApiProperty({ type: String })
    public readonly userId!: UserID;
}
```

```typescript
class UserEntity extends BaseEntity {
    @Property({ type: "string" })
    public id!: UserID;
}
```

## Flavored vs. Branded

Flavored types allow implicit conversion between the unflavored and flavored variant, but not between flavored types:
```typescript
type UserID = Flavor<string, "user">;
type SchoolID = Flavor<string, "school">;

// Works fine
const userid: UserID = "abc";

// Conversion to base type is allowed
const stringid: string = userid;

// Doesn't work
const schoolid: SchoolID = userid;

```

Branded types are stricter and need explicit conversion between unbranded and branded types:
```typescript
type UserID = Brand<string, "user">;
type SchoolID = Brand<string, "school">;

// Needs explicit casting
const userid: UserID = "abc" as UserID;

// Works the same as flavored
const stringid: string = userid;

// Doesn't work, same as flavored
const schoolid: SchoolID = userid;
```
