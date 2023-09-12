import { Entity } from '@mikro-orm/core';
import { RolleRechtEntity } from './rolle-recht.entity.js';

@Entity({ tableName: 'service_provider_zugriff', discriminatorValue: 'serviceProviderZugriff' })
export class ServiceProviderZugriffEntity extends RolleRechtEntity {}
