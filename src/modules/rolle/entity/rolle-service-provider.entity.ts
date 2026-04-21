import { BaseEntity, Entity, Index, ManyToOne, PrimaryKeyProp, Rel } from '@mikro-orm/core';
import { RolleEntity } from './rolle.entity.js';
import { ServiceProviderEntity } from '../../service-provider/repo/service-provider.entity.js';

@Entity({ tableName: 'rolle_service_provider' })
export class RolleServiceProviderEntity extends BaseEntity {
    @Index()
    @ManyToOne({ primary: true, entity: () => RolleEntity })
    public rolle!: Rel<RolleEntity>;

    @Index()
    @ManyToOne({ primary: true, entity: () => ServiceProviderEntity })
    public serviceProvider!: Rel<ServiceProviderEntity>;

    public [PrimaryKeyProp]?: ['rolle', 'serviceProvider'];
}
