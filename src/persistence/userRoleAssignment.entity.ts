import { TimestampedEntity } from './timestamped.entity';
import { Entity, ManyToOne, PrimaryKey } from '@mikro-orm/core';
import { PersonEntity } from '../modules/person/persistence/person.entity';
import { RoleEntity } from './role.entity';

@Entity({ tableName: 'user_role_assignment' })
export class UserRoleAssignmentEntity extends TimestampedEntity<UserRoleAssignmentEntity, 'id'> {
    @PrimaryKey()
    public id!: string;

    @ManyToOne(() => PersonEntity)
    public Person!: PersonEntity;

    @ManyToOne(() => RoleEntity)
    public Role!: RoleEntity;
}
