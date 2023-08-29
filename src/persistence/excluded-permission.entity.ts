import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { PersonEntity } from '../modules/person/persistence/person.entity.js';
import { RolePermissionEntity } from './role-permission.entity.js';

@Entity({ tableName: 'excluded_permission' })
export class ExcludedPermissionEntity extends TimestampedEntity<ExcludedPermissionEntity, 'id'> {
    public constructor() {
        super();
    }

    @Property()
    public name!: string;

    @ManyToOne()
    public person!: PersonEntity;

    @ManyToOne()
    public permission!: RolePermissionEntity;
}
