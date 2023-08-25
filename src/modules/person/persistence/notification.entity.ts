import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne, PrimaryKey, Rel } from '@mikro-orm/core';
import { PersonEntity } from './person.entity.js';

@Entity({ tableName: 'notification' })
export class NotificationEntity extends TimestampedEntity<NotificationEntity, 'id'> {
    public constructor() {
        super();
    }

    @PrimaryKey()
    public readonly id!: string;

    @ManyToOne(() => PersonEntity)
    public source!: Rel<PersonEntity>;

    @ManyToOne(() => PersonEntity)
    public target!: Rel<PersonEntity>;
}
