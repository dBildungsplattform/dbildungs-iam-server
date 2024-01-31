import { AutoMap } from '@automapper/classes';
import { BaseEntity, DateTimeType, OptionalProps, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export abstract class TimestampedEntity<
    Entity extends TimestampedEntity<Entity>,
    Populate extends string = string,
    Optional extends keyof Entity = never,
> extends BaseEntity<Entity, 'id', Populate> {
    public [OptionalProps]?: 'createdAt' | 'updatedAt' | Optional;

    @AutoMap()
    @PrimaryKey({ onCreate: () => randomUUID() })
    public readonly id!: string;

    @AutoMap(() => Date)
    @Property({ onCreate: () => new Date(), type: DateTimeType })
    public readonly createdAt!: Date;

    @AutoMap(() => Date)
    @Property({ onCreate: () => new Date(), onUpdate: () => new Date(), type: DateTimeType })
    public readonly updatedAt!: Date;
}
