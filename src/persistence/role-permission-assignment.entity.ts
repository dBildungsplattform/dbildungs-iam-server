import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { RolePermissionEntity } from './role-permission.entity.js';
import { SchoolStructureNodeEntity } from './school-structure-node.entity.js';

@Entity({ tableName: 'role_permission_assignment' })
export class RolePermissionAssignmentEntity extends TimestampedEntity<RolePermissionAssignmentEntity, 'id'> {
    @Property()
    public validForOrganisationalChildren!: boolean;

    @Property()
    public validForAdministrativeParents!: boolean;

    @ManyToOne()
    public rolePermission!: RolePermissionEntity;

    @ManyToOne()
    public schoolStructureNode!: SchoolStructureNodeEntity;
}
