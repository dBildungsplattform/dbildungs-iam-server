import { TimestampedEntity } from './timestamped.entity.js';
import { Entity } from '@mikro-orm/core';

@Entity({
    tableName: 'rolle_recht',
    discriminatorColumn: 'type',
})
export class RolleRechtEntity extends TimestampedEntity<RolleRechtEntity, 'id'> {}
