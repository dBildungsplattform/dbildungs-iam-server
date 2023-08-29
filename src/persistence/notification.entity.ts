import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne, Rel } from '@mikro-orm/core';
import { PersonEntity } from '../modules/person/persistence/person.entity.js';

@Entity({ tableName: 'notification' })
export class NotificationEntity extends TimestampedEntity<NotificationEntity, 'id'> {
    public constructor() {
        super();
    }

    @ManyToOne(() => PersonEntity)
    public source!: Rel<PersonEntity>;

    @ManyToOne(() => PersonEntity)
    public target!: Rel<PersonEntity>;
}
