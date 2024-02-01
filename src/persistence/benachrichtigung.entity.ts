import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, Property } from '@mikro-orm/core';

@Entity({ tableName: 'benachrichtigung' })
export class BenachrichtigungEntity extends TimestampedEntity {
    public constructor() {
        super();
    }

    /**
     * Links to Person
     */
    @Property()
    public source!: string;

    /**
     * Links to Person
     */
    @Property()
    public target!: string;
}
