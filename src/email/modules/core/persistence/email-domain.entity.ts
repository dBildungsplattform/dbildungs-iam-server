import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { TimestampedEntity } from '../../../../persistence/timestamped.entity.js';

@Entity({ schema: 'email', tableName: 'domain' })
export class EmailDomainEntity extends TimestampedEntity {
    @Property({ nullable: false })
    public domain!: string;
    @Property({ nullable: false, columnType: 'uuid' })
    public spshServiceProviderId!: string;
}
