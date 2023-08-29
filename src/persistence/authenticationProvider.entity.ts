import { TimestampedEntity } from './timestamped.entity.js';
import { ManyToOne, PrimaryKey } from '@mikro-orm/core';
import { DataProviderEntity } from './dataProvider.entity.js';

export class AuthenticationProviderEntity extends TimestampedEntity<AuthenticationProviderEntity, 'id'> {
    @PrimaryKey()
    public readonly id!: string;

    @ManyToOne()
    public dataProvider!: DataProviderEntity;
}
