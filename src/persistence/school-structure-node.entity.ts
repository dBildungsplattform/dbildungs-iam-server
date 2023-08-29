import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne, OneToOne } from '@mikro-orm/core';
import { DataProviderEntity } from './data-provider.entity.js';

@Entity({
    tableName: 'school_structure_node',
    discriminatorColumn: 'nodeType',
    discriminatorMap: { sponsor: 'sponsor', organization: 'organization', group: 'group' },
})
export abstract class SchoolStructureNodeEntity extends TimestampedEntity<SchoolStructureNodeEntity, 'id'> {
    @OneToOne()
    public administrativeParent?: SchoolStructureNodeEntity;

    @OneToOne()
    public organizationalParent?: SchoolStructureNodeEntity;

    @ManyToOne()
    public dataProvider?: DataProviderEntity;
}
