import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne, PrimaryKey } from '@mikro-orm/core';
import { PersonEntity } from '../modules/person/persistence/person.entity.js';
import { RoleEntity } from './role.entity.js';
import {SchoolStructureNodeEntity} from "./school-structure-node.entity.js";

@Entity({ tableName: 'user_role_assignment' })
export class UserRoleAssignmentEntity extends TimestampedEntity<UserRoleAssignmentEntity, 'id'> {
    @PrimaryKey()
    public id!: string;

    @ManyToOne()
    public person!: PersonEntity;

    @ManyToOne()
    public role!: RoleEntity;

    @ManyToOne()
    public schoolStructureNode!: SchoolStructureNodeEntity;
}
