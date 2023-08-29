import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { RolePermissionEntity } from './rolePermission.entity.js';
import { SchoolStructureNodeEntity } from './schoolStructureNode.entity.js';

@Entity({ tableName: 'role_permission_assignment' })
export class RolePermissionAssignmentEntity extends TimestampedEntity<RolePermissionAssignmentEntity, 'id'> {
    @PrimaryKey()
    public readonly id!: string;

    @Property()
    public validForOrganisationalChildren!: boolean;

    @Property()
    public validForAdministrativeParents!: boolean;

    @ManyToOne()
    public rolePermission!: RolePermissionEntity;

    @ManyToOne()
    public schoolStructureNode!: SchoolStructureNodeEntity;
}
