import { TimestampedEntity } from './timestamped.entity';
import { Entity, OneToOne, PrimaryKey } from '@mikro-orm/core';

@Entity({
    tableName: 'school_structure_node',
    discriminatorColumn: 'nodeType',
    discriminatorMap: { sponsor: 'sponsor', organization: 'organization', group: 'group' },
})
export abstract class SchoolStructureNodeEntity extends TimestampedEntity<SchoolStructureNodeEntity, 'id'> {
    @PrimaryKey()
    public readonly id!: string;

    @OneToOne()
    public administrativeParent?: SchoolStructureNodeEntity;

    @OneToOne()
    public organizationalParent?: SchoolStructureNodeEntity;
}
