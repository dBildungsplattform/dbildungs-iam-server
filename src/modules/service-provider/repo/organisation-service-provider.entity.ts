import { BaseEntity, Entity, ManyToOne, PrimaryKeyProp, Rel } from '@mikro-orm/core';
import { ServiceProviderEntity } from './service-provider.entity.js';
import { OrganisationEntity } from '../../organisation/persistence/organisation.entity.js';

@Entity({ tableName: 'organisation_service_provider' })
export class OrganisationServiceProviderEntity extends BaseEntity {
    @ManyToOne({ primary: true, entity: () => OrganisationEntity })
    public organisation!: Rel<OrganisationEntity>;

    @ManyToOne({ primary: true, entity: () => ServiceProviderEntity })
    public serviceProvider!: Rel<ServiceProviderEntity>;

    public [PrimaryKeyProp]?: ['organisation', 'serviceProvider'];
}
