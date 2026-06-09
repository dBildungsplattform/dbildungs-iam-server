import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';

@Entity({ tableName: 'ox_user_blacklist' })
export class OxUserBlacklistEntity extends TimestampedEntity {
    @Property()
    public email!: string;

    @Property()
    public name!: string;

    @Property()
    public username!: string;
}
