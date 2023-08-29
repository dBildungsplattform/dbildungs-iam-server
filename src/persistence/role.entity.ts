import { TimestampedEntity } from './timestamped.entity';
import { Entity, ManyToOne, PrimaryKey } from '@mikro-orm/core';
import { SchoolStructureNodeEntity } from './schoolStructureNode.entity';

@Entity({ tableName: 'role' })
export class RoleEntity extends TimestampedEntity<RoleEntity, 'id'> {
    @PrimaryKey()
    public id!: string;

    @ManyToOne()
    public administeredBy!: SchoolStructureNodeEntity;
}
