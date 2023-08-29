import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, PrimaryKey } from '@mikro-orm/core';

@Entity({
    tableName: 'role_permission',
})
export class RolePermissionEntity extends TimestampedEntity<RolePermissionEntity, 'id'> {
    @PrimaryKey()
    public readonly id!: string;
}
