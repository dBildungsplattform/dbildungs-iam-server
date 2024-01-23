import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { Entity, Enum, Property } from '@mikro-orm/core';
import { AutoMap } from '@automapper/classes';
import { RollenArt, RollenMerkmal } from '../domain/rolle.enums.js';

@Entity({ tableName: 'rolle' })
export class RolleEntity extends TimestampedEntity<RolleEntity, 'id'> {
    @Property()
    @AutoMap()
    public name!: string;

    /**
     * Points to Schulstrukturknoten
     */
    @AutoMap()
    @Property()
    public administeredBySchulstrukturknoten!: string;

    @AutoMap(() => String)
    @Enum(() => RollenArt)
    public rollenart!: RollenArt;

    @AutoMap(() => [String])
    @Enum({ items: () => RollenMerkmal, array: true, default: [] })
    public merkmale: RollenMerkmal[] = [];
}
