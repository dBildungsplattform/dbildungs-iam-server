import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne, OneToOne } from '@mikro-orm/core';
import { DataProviderEntity } from './data-provider.entity.js';

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

    @ManyToOne()
    public dataProvider?: DataProviderEntity;
}
