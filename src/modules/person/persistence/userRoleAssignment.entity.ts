import { TimestampedEntity } from './timestamped.entity.js';
import { Entity, ManyToOne, PrimaryKey } from '@mikro-orm/core';
import { PersonEntity } from './person.entity.js';
import { RoleEntity } from './role.entity.js';

@Entity({ tableName: 'user_role_assignment' })
export class UserRoleAssignmentEntity extends TimestampedEntity<UserRoleAssignmentEntity, 'id'> {
    @PrimaryKey()
    public id!: string;

    @ManyToOne(() => PersonEntity)
    public Person!: PersonEntity;

    @ManyToOne(() => RoleEntity)
    public Role!: RoleEntity;
}
