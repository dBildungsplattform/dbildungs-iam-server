import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, PrimaryKey } from '@mikro-orm/core';

@Entity({ tableName: 'data_provider' })
export class DataProviderEntity extends TimestampedEntity<DataProviderEntity, 'id'> {
    @PrimaryKey()
    public id!: string;
}
