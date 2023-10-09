import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, Property } from '@mikro-orm/core';

@Entity({ tableName: 'rolle' })
export class RolleEntity extends TimestampedEntity<RolleEntity, 'id'> {
    /**
     * Points to Schulstrukturknoten
     */
    @Property()
    public administeredBySchulstrukturknoten!: string;
}
