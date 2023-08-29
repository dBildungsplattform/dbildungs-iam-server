import { TimestampedEntity } from './timestamped.entity';
import { Entity, ManyToOne, PrimaryKey } from '@mikro-orm/core';
import { SchoolStructureNodeEntity } from './schoolStructureNode.entity';

@Entity({ tableName: 'service_provider' })
export class ServiceProviderEntity extends TimestampedEntity<ServiceProviderEntity, 'id'> {
    @PrimaryKey()
    public id!: string;

    @ManyToOne()
    public providedOnNode!: SchoolStructureNodeEntity;
}
