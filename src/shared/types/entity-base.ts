import { AutoMap } from '@automapper/classes';
import { BaseEntity, DateTimeType, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

@Entity({ abstract: true })
export abstract class EntityBase<E extends EntityBase<E>> extends BaseEntity<E, 'id'> {
    @AutoMap()
    @PrimaryKey({ onCreate: () => randomUUID() })
    public readonly id!: string;

    @AutoMap()
    @Property({ onCreate: () => new Date(), type: DateTimeType })
    public readonly createdAt!: Date;

    @AutoMap()
    @Property({ onCreate: () => new Date(), onUpdate: () => new Date(), type: DateTimeType })
    public readonly updatedAt!: Date;
}
