import { BaseEntity, PrimaryKeyProp, Rel } from '@mikro-orm/core';
import { RolleEntity } from './rolle.entity.js';
import { RollenSystemRechtEnum } from '../domain/systemrecht.js';
import { Entity, Enum, Index, ManyToOne } from '@mikro-orm/decorators/legacy';

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
