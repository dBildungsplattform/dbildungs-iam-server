import { TimestampedEntity } from './timestamped.entity';
import { Entity, ManyToOne, PrimaryKey } from '@mikro-orm/core';
import { PermissionEntity } from './permission.entity';

@Entity({
    tableName: 'role_permission',
})
export class RolePermissionEntity extends TimestampedEntity<RolePermissionEntity, 'id'> {
    @PrimaryKey()
    public readonly id!: string;

    @ManyToOne()
    public permission!: PermissionEntity;
}
