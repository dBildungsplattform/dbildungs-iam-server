import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne, PrimaryKey } from '@mikro-orm/core';
import { SchoolStructureNodeEntity } from './school-structure-node.entity.js';

@Entity({ tableName: 'role' })
export class RoleEntity extends TimestampedEntity<RoleEntity, 'id'> {
    @PrimaryKey()
    public id!: string;

    @ManyToOne()
    public administeredBy!: SchoolStructureNodeEntity;
}
