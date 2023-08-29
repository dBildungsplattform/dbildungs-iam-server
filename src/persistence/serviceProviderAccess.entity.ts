import { Entity } from '@mikro-orm/core';
import { RolePermissionEntity } from './rolePermission.entity';

@Entity({ discriminatorValue: 'serviceProviderAccess' })
export class ServiceProviderAccessEntity extends RolePermissionEntity {}
