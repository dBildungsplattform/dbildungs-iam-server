import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne, PrimaryKey } from '@mikro-orm/core';
import { SchoolStructureNodeEntity } from './school-structure-node.entity.js';

@Entity({ tableName: 'service_provider' })
export class ServiceProviderEntity extends TimestampedEntity<ServiceProviderEntity, 'id'> {
    @PrimaryKey()
    public id!: string;

    @ManyToOne()
    public providedOnNode!: SchoolStructureNodeEntity;
}
