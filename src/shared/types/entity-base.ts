import { DateTimeType, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

@Entity({ abstract: true })
export abstract class EntityBase {
    @PrimaryKey()
    public readonly id: string = randomUUID();

    @Property({ type: DateTimeType })
    public readonly createdAt: Date = new Date();

    @Property({ onUpdate: () => new Date(), type: DateTimeType })
    public readonly updatedAt: Date = new Date();
}
