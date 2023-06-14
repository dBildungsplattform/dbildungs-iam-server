import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

@Entity({ abstract: true })
export abstract class EntityBase {
    @PrimaryKey()
    public readonly id: string = randomUUID();

    @Property()
    public readonly createdAt: Date = new Date();

    @Property({ onUpdate: () => new Date() })
    public readonly updatedAt: Date = new Date();
}
