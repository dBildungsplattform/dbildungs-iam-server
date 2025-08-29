import { BaseEntity, Entity, Enum, Index, ManyToOne, PrimaryKeyProp, Rel } from '@mikro-orm/core';
import { RolleEntity } from './rolle.entity.js';
import { RollenSystemRechtEnum } from '../domain/systemrecht.js';

@Entity({ tableName: 'rolle_systemrecht' })
export class RolleSystemrechtEntity extends BaseEntity {
    @ManyToOne({ primary: true, entity: () => RolleEntity })
    @Index({
        name: 'rolle_systemrecht_rolle_id_index',
    })
    public rolle!: Rel<RolleEntity>;

    @Enum({ primary: true, items: () => RollenSystemRechtEnum, nativeEnumName: 'rollen_system_recht_enum' })
    public systemrecht!: RollenSystemRechtEnum;

    public [PrimaryKeyProp]?: ['rolle', 'systemrecht'];
}
