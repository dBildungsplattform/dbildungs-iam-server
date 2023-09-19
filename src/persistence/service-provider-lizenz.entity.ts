import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne } from '@mikro-orm/core';
import { ServiceProviderEntity } from './service-provider.entity.js';
import { SchulstrukturknotenEntity } from './schulstrukturknoten.entity.js';

@Entity({ tableName: 'service_provider_lizenz' })
export class ServiceProviderLizenzEntity extends TimestampedEntity<ServiceProviderLizenzEntity, 'id'> {
    @ManyToOne()
    public serviceProvider!: ServiceProviderEntity;

    @ManyToOne()
    public schoolStructureNode!: SchulstrukturknotenEntity;
}
