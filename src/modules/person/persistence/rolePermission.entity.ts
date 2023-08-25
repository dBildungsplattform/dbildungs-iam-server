import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne, PrimaryKey } from '@mikro-orm/core';
import { PermissionEntity } from './permission.entity.js';

@Entity({
    tableName: 'role_permission',
})
export class RolePermissionEntity extends TimestampedEntity<RolePermissionEntity, 'id'> {
    @PrimaryKey()
    public readonly id!: string;

    @ManyToOne()
    public permission!: PermissionEntity;
}
