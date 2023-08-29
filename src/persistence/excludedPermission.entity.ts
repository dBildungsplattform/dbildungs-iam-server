import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { PersonEntity } from '../modules/person/persistence/person.entity.js';
import { RolePermissionEntity } from './rolePermission.entity.js';

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
