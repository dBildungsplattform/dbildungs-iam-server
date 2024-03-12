import { Cascade, Collection, Entity, Enum, OneToMany, Property } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { RollenArt } from '../domain/rolle.enums.js';
import { RolleMerkmalEntity } from './rolle-merkmal.entity.js';
import { RolleServiceProviderEntity } from './rolle-service-provider.entity.js';

@Entity({ tableName: 'rolle' })
export class RolleEntity extends TimestampedEntity {
    @Property()
    public name!: string;

    /**
     * Points to Schulstrukturknoten
     */
    @Property()
    public administeredBySchulstrukturknoten!: string;

    @Enum(() => RollenArt)
    public rollenart!: RollenArt;

    @OneToMany({
        entity: () => RolleMerkmalEntity,
        mappedBy: 'rolle',
        orphanRemoval: true,
        cascade: [Cascade.ALL],
    })
    public merkmale: Collection<RolleMerkmalEntity> = new Collection<RolleMerkmalEntity>(this);

    @OneToMany({
        entity: () => RolleServiceProviderEntity,
        mappedBy: 'rolle',
        orphanRemoval: true,
        cascade: [Cascade.ALL],
    })
    public serviceProvider: Collection<RolleServiceProviderEntity> = new Collection<RolleServiceProviderEntity>(this);
}
