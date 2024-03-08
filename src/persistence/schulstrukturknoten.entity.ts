import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, OneToOne, Property } from '@mikro-orm/core';

@Entity({
    tableName: 'schulstrukturknoten',
    discriminatorColumn: 'nodeType',
    discriminatorMap: { traeger: 'traeger', organisation: 'organisation', group: 'gruppe' },
})
export abstract class SchulstrukturknotenEntity extends TimestampedEntity {
    @OneToOne({ columnType: 'uuid' })
    public administrativeParent?: SchulstrukturknotenEntity;

    @OneToOne({ columnType: 'uuid' })
    public organizationalParent?: SchulstrukturknotenEntity;

    /**
     * Points to DataProvider
     */
    @Property({ columnType: 'uuid' })
    public dataProvider?: string;
}
