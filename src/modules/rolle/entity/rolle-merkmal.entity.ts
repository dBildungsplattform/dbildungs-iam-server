import { BaseEntity, Entity, Enum, ManyToOne, Rel } from '@mikro-orm/core';
import { RollenMerkmal } from '../domain/rolle.enums.js';
import { RolleEntity } from './rolle.entity.js';

@Entity({ tableName: 'rolle_merkmal' })
export class RolleMerkmalEntity extends BaseEntity<RolleMerkmalEntity, 'rolle' | 'merkmal'> {
    @ManyToOne({ primary: true, entity: () => RolleEntity })
    public rolle!: Rel<RolleEntity>;

    @Enum({ primary: true, items: () => RollenMerkmal })
    public merkmal!: RollenMerkmal;
}
