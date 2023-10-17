import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { Entity, Property } from '@mikro-orm/core';
import { AutoMap } from '@automapper/classes';

@Entity({ tableName: 'service_provider' })
export class ServiceProviderEntity extends TimestampedEntity<ServiceProviderEntity, 'id'> {
    @AutoMap()
    @Property()
    public name!: string;

    @AutoMap()
    @Property()
    public url!: string;

    /**
     * Points to Schulstrukturknoten
     */
    @AutoMap()
    @Property()
    public providedOnSchulstrukturknoten!: string;
}
