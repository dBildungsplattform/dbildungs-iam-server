import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne } from '@mikro-orm/core';
import { SchulstrukturknotenEntity } from './schulstrukturknoten.entity.js';

@Entity({ tableName: 'rolle' })
export class RolleEntity extends TimestampedEntity<RolleEntity, 'id'> {
    @ManyToOne()
    public administeredBy!: SchulstrukturknotenEntity;
}
