import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne } from '@mikro-orm/core';
import { DataProviderEntity } from './data-provider.entity.js';

@Entity({ tableName: 'authentication_provider' })
export class AuthenticationProviderEntity extends TimestampedEntity<AuthenticationProviderEntity, 'id'> {
    @ManyToOne()
    public dataProvider!: DataProviderEntity;
}
