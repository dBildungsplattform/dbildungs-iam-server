import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne } from '@mikro-orm/core';
import { SchoolStructureNodeEntity } from './school-structure-node.entity.js';

@Entity({ tableName: 'service_provider' })
export class ServiceProviderEntity extends TimestampedEntity<ServiceProviderEntity, 'id'> {
    @ManyToOne()
    public providedOnNode!: SchoolStructureNodeEntity;
}
