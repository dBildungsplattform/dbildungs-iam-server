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




