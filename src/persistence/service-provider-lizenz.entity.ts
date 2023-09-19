import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne } from '@mikro-orm/core';
import { ServiceProviderEntity } from './service-provider.entity.js';

@Entity({ tableName: 'service_provider_lizenz' })
export class ServiceProviderLizenzEntity extends TimestampedEntity<ServiceProviderLizenzEntity, 'id'> {
    @ManyToOne()
    public serviceProvider!: ServiceProviderEntity;

    /**
     * Points to Schulstrukturknoten
     */
    public schoolStructureNode!: string;
}
