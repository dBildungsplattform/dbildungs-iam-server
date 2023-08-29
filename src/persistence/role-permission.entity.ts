import { TimestampedEntity } from './timestamped.entity.js';
import { Entity } from '@mikro-orm/core';

@Entity({
    tableName: 'role_permission',
})
export class RolePermissionEntity extends TimestampedEntity<RolePermissionEntity, 'id'> {}
