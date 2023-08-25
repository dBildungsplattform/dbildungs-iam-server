import { Entity } from '@mikro-orm/core';
import { RolePermissionEntity } from './rolePermission.entity.js';

@Entity({ discriminatorValue: 'systemAccess' })
export class SystemAccessEntity extends RolePermissionEntity {}
