import { Entity } from '@mikro-orm/core';
import { RolePermissionEntity } from './role-permission.entity.js';

@Entity({ discriminatorValue: 'serviceProviderAccess' })
export class ServiceProviderAccessEntity extends RolePermissionEntity {}
