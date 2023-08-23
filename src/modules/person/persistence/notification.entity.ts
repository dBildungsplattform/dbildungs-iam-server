import { TimestampedEntity } from './timestamped.entity.js';
import { Entity } from '@mikro-orm/core';

@Entity({ tableName: 'notification' })
export class NotificationEntity extends TimestampedEntity<NotificationEntity, 'id'> {
    public constructor() {
        super();
    }

    public readonly id!: string;
}
