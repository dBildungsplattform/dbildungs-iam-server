import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne, Rel } from '@mikro-orm/core';
import { PersonEntity } from '../modules/person/persistence/person.entity.js';

@Entity({ tableName: 'benachrichtigung' })
export class BenachrichtigungEntity extends TimestampedEntity<BenachrichtigungEntity, 'id'> {
    public constructor() {
        super();
    }

    @ManyToOne(() => PersonEntity)
    public source!: Rel<PersonEntity>;

    @ManyToOne(() => PersonEntity)
    public target!: Rel<PersonEntity>;
}
