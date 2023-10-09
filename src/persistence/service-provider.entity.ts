import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, Property } from '@mikro-orm/core';

@Entity({ tableName: 'service_provider' })
export class ServiceProviderEntity extends TimestampedEntity<ServiceProviderEntity, 'id'> {
    /**
     * Points to Schulstrukturknoten
     */
    @Property()
    public providedOnSchulstrukturknoten!: string;
}
