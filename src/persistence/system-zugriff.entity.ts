import { Entity } from '@mikro-orm/core';
import { RolleRechtEntity } from './rolle-recht.entity.js';

@Entity({ tableName: 'system_zugriff', discriminatorValue: 'systemZugriff' })
export class SystemZugriffEntity extends RolleRechtEntity {}
