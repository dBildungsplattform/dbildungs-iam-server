import { TimestampedEntity } from './timestamped.entity.js';
import { ManyToOne } from '@mikro-orm/core';
import { DataProviderEntity } from './data-provider.entity.js';

export class AuthenticationProviderEntity extends TimestampedEntity<AuthenticationProviderEntity, 'id'> {
    @ManyToOne()
    public dataProvider!: DataProviderEntity;
}
