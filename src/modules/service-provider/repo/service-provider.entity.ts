import { BlobType, Check, Collection, Entity, Enum, OneToMany, Property } from '@mikro-orm/core';

import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import {
    ServiceProviderKategorie,
    ServiceProviderSystem,
    ServiceProviderTarget,
} from '../domain/service-provider.enum.js';
import { ServiceProviderMerkmalEntity } from './service-provider-merkmal.entity.js';

@Entity({ tableName: 'service_provider' })
@Check({
    name: 'logo_or_logo_id_consistency',
    expression:
        '(logo_id IS NULL AND logo IS NULL) OR (logo_id IS NULL AND logo IS NOT NULL) OR (logo_id IS NOT NULL AND logo IS NULL)',
})
export class ServiceProviderEntity extends TimestampedEntity {
    @Property()
    public name!: string;

    @Enum({ items: () => ServiceProviderTarget, nativeEnumName: 'service_provider_target_enum' })
    public target!: ServiceProviderTarget;

    @Property({ nullable: true })
    public url?: string;

    @Property({ columnType: 'uuid' })
    public providedOnSchulstrukturknoten!: string;

    @Enum({
        items: () => ServiceProviderKategorie,
        nativeEnumName: 'service_provider_kategorie_enum',
        customOrder: [
            ServiceProviderKategorie.EMAIL,
            ServiceProviderKategorie.UNTERRICHT,
            ServiceProviderKategorie.VERWALTUNG,
            ServiceProviderKategorie.SCHULISCH,
            ServiceProviderKategorie.HINWEISE,
        ],
    })
    public kategorie!: ServiceProviderKategorie;

    @Property({ nullable: true, unsigned: true, columnType: 'int' })
    public logoId?: number;

    @Property({ type: BlobType, nullable: true })
    public logo?: Buffer;

    @Property({ nullable: true })
    public logoMimeType?: string;

    @Property({ nullable: true })
    public keycloakGroup?: string;

    @Property({ nullable: true })
    public keycloakRole?: string;

    @Enum({ items: () => ServiceProviderSystem, nativeEnumName: 'service_provider_system_enum' })
    public externalSystem!: ServiceProviderSystem;

    @Property()
    public requires2fa!: boolean;

    @Property({ nullable: true })
    public vidisAngebotId?: string;

    @OneToMany({
        entity: () => ServiceProviderMerkmalEntity,
        mappedBy: 'serviceProvider',
        orphanRemoval: true,
        eager: true,
    })
    public merkmale: Collection<ServiceProviderMerkmalEntity> = new Collection<ServiceProviderMerkmalEntity>(this);
}
