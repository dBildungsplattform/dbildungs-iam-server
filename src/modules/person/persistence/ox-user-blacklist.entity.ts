import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { Entity, Property } from '@mikro-orm/core';

@Entity({ tableName: 'ox_user_blacklist' })
export class OxUserBlacklistEntity extends TimestampedEntity {

    @Property()
    public email!: string;

    @Property()
    public name!: string;

    @Property()
    public username!: string;
}
