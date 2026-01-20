import { BaseEntity, Entity, Enum, Index, ManyToOne, PrimaryKeyProp, Rel } from '@mikro-orm/core';
import { ServiceProviderMerkmal } from '../domain/service-provider.enum.js';
import { ServiceProviderEntity } from './service-provider.entity.js';

@Entity({ tableName: 'service_provider_merkmal' })
export class ServiceProviderMerkmalEntity extends BaseEntity {
    @ManyToOne({ primary: true, entity: () => ServiceProviderEntity })
    @Index({
        name: 'service_provider_merkmal_service_provider_id_index',
    })
    public serviceProvider!: Rel<ServiceProviderEntity>;

    @Enum({ primary: true, items: () => ServiceProviderMerkmal, nativeEnumName: 'service_provider_merkmal_enum' })
    public merkmal!: ServiceProviderMerkmal;

    public [PrimaryKeyProp]?: ['serviceProvider', 'merkmal'];
}
