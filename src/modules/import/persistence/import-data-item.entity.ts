import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { Property } from '@mikro-orm/core';

export class ImportDataItemEntity extends TimestampedEntity {
    @Property({ columnType: 'uuid' })
    public readonly importvorgangId!: string;

    @Property()
    public readonly familienname!: string;

    @Property()
    public readonly vorname!: string;

    @Property({ nullable: true })
    public readonly organisation?: string;

    @Property({ nullable: true })
    public personalnummer?: string;
}
