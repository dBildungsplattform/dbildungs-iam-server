import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, Property } from '@mikro-orm/core';
import { PersonEntity } from './person.entity.js';

@Entity({ tableName: 'notification' })
export class NotificationEntity extends TimestampedEntity<NotificationEntity, 'id'> {
    public constructor() {
        super();
    }

    public readonly id!: string;

    @Property()
    public source!: PersonEntity;

    @Property()
    public target!: PersonEntity;
}
