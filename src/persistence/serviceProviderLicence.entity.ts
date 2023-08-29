import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne, PrimaryKey } from '@mikro-orm/core';
import { ServiceProviderEntity } from './serviceProvider.entity.js';
import { SchoolStructureNodeEntity } from './schoolStructureNode.entity.js';

@Entity({ tableName: 'service_provider_licence' })
export class ServiceProviderLicenceEntity extends TimestampedEntity<ServiceProviderLicenceEntity, 'id'> {
    @PrimaryKey()
    public id!: string;

    @ManyToOne()
    public serviceProvider!: ServiceProviderEntity;

    @ManyToOne()
    public schoolStructureNode!: SchoolStructureNodeEntity;
}
