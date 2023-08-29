import { Entity } from '@mikro-orm/core';
import { RolePermissionEntity } from './role-permission.entity.js';

@Entity({ discriminatorValue: 'systemAccess' })
export class SystemAccessEntity extends RolePermissionEntity {}
