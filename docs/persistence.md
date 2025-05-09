# Developer notes on persistence layer

## Mapping aggregates to entities

During development many aggregates were created and these aggregates have to be persisted as entities.
Therefore, repositories were built which typically contain at least a _mapAggregateToData_ method and a _mapDataToAggregate_ method.

### Troubleshooting

If you encounter following error while writing such a method, 'Type Option<string> is not assignable to type string' e.g. on the id:

```typescript
function mapAggregateToData(aggregate: Aggregate<boolean>): RequiredEntityData<Aggregate> {
    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: aggregate.id, //Here following error is shown: Type Option<string> is not assignable to type string
        personId: rel(PersonEntity, aggregate.personId),
        value: aggregate.value,
    };
}
```
make sure that id is the primary key for the entity, additional declarations of primary key attributes may result in the error mentioned above, like e.g. in this entity:
```typescript
@Entity({ tableName: 'tableName' })
export class Entitiy extends TimestampedEntity {
    //...
    public [PrimaryKeyProp]?: ['anotherProp'];
}
```

## Usage of Mikro-ORM relations

Things to note when using Mikro-ORMs relation decorators (i.e. `@<X>To<Y>`)

__DON'T__ use `Cascade.REMOVE`. This enables both application-level cascading and the database `ON DELETE CASCADE`. Application-level cascading has a lot of caveats and we would like to avoid it.

## Relation is just for reading data

This is the scenario, where the relation is just used for querying (or filtering) and the other side of the relation has it's own repository.

On the parent-side (i.e. Person) don't set any cascading
```ts
@OneToMany({
    entity: () => UserLockEntity,
    mappedBy: 'person',
})
```

On the child-side (i.e. UserLocks)
```ts
@ManyToOne({
    entity: () => PersonEntity,
    fieldName: 'person_id',
    columnType: 'uuid',
    deleteRule: 'cascade', // Omit this, if the entry should not be deleted when the parent is deleted. In that case you probably don't wan't to use a foreign key constraint
    ref: true,
    nullable: false,
})
```

## Relation is just for writing data

This is the scenario, where the other side of the relation does not have it's own repo and is controlled by the parent.
Make sure the mapping-functions in the repo can handle both directions, since they are the only way to set data.

The side with the collection (i.e. the managing side) enables 'orphanRemoval' so Mikro-ORM will ensure there are no dangling entries.

The child-side sets the `deleteRule` so it is being deleted by the database, if the parent gets deleted.

On the parent-side (i.e. Person)
```ts
@OneToMany({
    entity: () => PersonExternalIdMappingEntity,
    mappedBy: 'person',
    orphanRemoval: true,
    eager: true, // Since this collection is the source of truth, you probably want to always load it. Otherwise loading and saving might delete the collection because it is empty
})
```

On the child-side (i.e. PersonExternalIdMapping)
```ts
@ManyToOne({
    entity: () => PersonEntity,
    columnType: 'uuid',
    deleteRule: 'cascade',
    ref: true,
    nullable: false,
    // [...]
})
```




