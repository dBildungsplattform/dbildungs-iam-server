import { BlobType, Entity, Enum, Property } from '@mikro-orm/core';

import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { ServiceProviderKategorie } from '../domain/service-provider.enum.js';

@Entity({ tableName: 'service_provider' })
export class ServiceProviderEntity extends TimestampedEntity {
    @Property()
    public name!: string;

    @Property()
    public url!: string;

    @Property()
    public providedOnSchulstrukturknoten!: string;

    @Enum(() => ServiceProviderKategorie)
    public kategorie!: ServiceProviderKategorie;

    @Property({ type: BlobType, nullable: true })
    public logo?: Buffer;

    @Property({ nullable: true })
    public logoMimeType?: string;
}
