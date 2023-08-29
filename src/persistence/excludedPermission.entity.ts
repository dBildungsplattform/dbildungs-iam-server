import { TimestampedEntity } from './timestamped.entity';
import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { PersonEntity } from '../modules/person/persistence/person.entity';
import { RolePermissionEntity } from './rolePermission.entity';

@Entity({ tableName: 'excluded_permission' })
export class ExcludedPermissionEntity extends TimestampedEntity<ExcludedPermissionEntity, 'id'> {
    public constructor() {
        super();
    }

    @PrimaryKey()
    public readonly id!: string;

    @Property()
    public name!: string;

    @ManyToOne()
    public person!: PersonEntity;

    @ManyToOne()
    public permission!: RolePermissionEntity;
}
