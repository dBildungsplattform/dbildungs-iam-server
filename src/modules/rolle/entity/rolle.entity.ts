import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { Entity, Property } from '@mikro-orm/core';
import { AutoMap } from '@automapper/classes';

@Entity({ tableName: 'rolle' })
export class RolleEntity extends TimestampedEntity<RolleEntity, 'id'> {
    @Property()
    @AutoMap()
    public name!: string;

    /**
     * Points to Schulstrukturknoten
     */
    @AutoMap()
    @Property()
    public administeredBySchulstrukturknoten!: string;
}
