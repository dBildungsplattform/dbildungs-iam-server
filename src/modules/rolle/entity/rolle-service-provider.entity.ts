import { BaseEntity, PrimaryKeyProp, Rel } from '@mikro-orm/core';
import { Entity, Index, ManyToOne } from '@mikro-orm/decorators/legacy';
import { ServiceProviderEntity } from '../../service-provider/repo/service-provider.entity.js';
import { RolleEntity } from './rolle.entity.js';

@Entity({ tableName: 'rolle_service_provider' })
export class RolleServiceProviderEntity extends BaseEntity {
    @Index()
    @ManyToOne({ primary: true, entity: () => RolleEntity, deleteRule: 'no action', updateRule: 'cascade' })
    public rolle!: Rel<RolleEntity>;

    @Index()
    @ManyToOne({ primary: true, entity: () => ServiceProviderEntity, deleteRule: 'no action', updateRule: 'cascade' })
    public serviceProvider!: Rel<ServiceProviderEntity>;

    public [PrimaryKeyProp]?: ['rolle', 'serviceProvider'];
}
