import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, OneToOne, Property } from '@mikro-orm/core';

@Entity({
    tableName: 'schulstrukturknoten',
    discriminatorColumn: 'nodeType',
    discriminatorMap: { traeger: 'traeger', organisation: 'organisation', group: 'gruppe' },
})
export abstract class SchulstrukturknotenEntity extends TimestampedEntity {
    @OneToOne()
    public administrativeParent?: SchulstrukturknotenEntity;

    @OneToOne()
    public organizationalParent?: SchulstrukturknotenEntity;

    /**
     * Points to DataProvider
     */
    @Property()
    public dataProvider?: string;
}
