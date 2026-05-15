import { BaseEntity, PrimaryKeyProp, Rel } from '@mikro-orm/core';
import { ServiceProviderEntity } from './service-provider.entity.js';
import { OrganisationEntity } from '../../organisation/persistence/organisation.entity.js';
import { Entity, ManyToOne } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'organisation_service_provider' })
export class OrganisationServiceProviderEntity extends BaseEntity {
    @ManyToOne({ primary: true, entity: () => OrganisationEntity, deleteRule: 'no action', updateRule: 'cascade' })
    public organisation!: Rel<OrganisationEntity>;

    @ManyToOne({ primary: true, entity: () => ServiceProviderEntity, deleteRule: 'no action', updateRule: 'cascade' })
    public serviceProvider!: Rel<ServiceProviderEntity>;

    public [PrimaryKeyProp]?: ['organisation', 'serviceProvider'];
}
