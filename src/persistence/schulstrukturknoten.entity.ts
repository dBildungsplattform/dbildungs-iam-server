import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, OneToOne } from '@mikro-orm/core';

@Entity({
    tableName: 'schulstrukturknoten',
    discriminatorColumn: 'nodeType',
    discriminatorMap: { traeger: 'traeger', organisation: 'organisation', group: 'gruppe' },
})
export abstract class SchulstrukturknotenEntity extends TimestampedEntity<SchulstrukturknotenEntity, 'id'> {
    @OneToOne()
    public administrativeParent?: SchulstrukturknotenEntity;

    @OneToOne()
    public organizationalParent?: SchulstrukturknotenEntity;

    /**
     * Points to DataProvider
     */
    public dataProvider?: string;
}
