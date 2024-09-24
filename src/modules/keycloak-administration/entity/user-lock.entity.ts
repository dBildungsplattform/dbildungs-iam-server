import { Entity, Property, PrimaryKey } from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';

@Entity({ tableName: 'user_lock' })
export class UserLockEntity extends TimestampedEntity {
    @PrimaryKey({ columnType: 'uuid', onCreate: () => randomUUID() })
    public readonly personId!: string;

    @Property({ nullable: true })
    public locked_by!: string;

    @Property({ nullable: true })
    public locked_until!: Date;
}
