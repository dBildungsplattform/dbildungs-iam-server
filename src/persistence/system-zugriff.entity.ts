import { Entity } from '@mikro-orm/core';
import { RolleRechtEntity } from '../modules/rolle/entity/rolle-recht.entity.js';

@Entity({ tableName: 'system_zugriff', discriminatorValue: 'systemZugriff' })
export class SystemZugriffEntity extends RolleRechtEntity {}
