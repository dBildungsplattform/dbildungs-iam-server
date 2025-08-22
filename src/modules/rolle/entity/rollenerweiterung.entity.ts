import { Entity, Index, ManyToOne, Ref, Unique } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { OrganisationEntity } from '../../organisation/persistence/organisation.entity.js';
import { ServiceProviderEntity } from '../../service-provider/repo/service-provider.entity.js';
import { RolleEntity } from './rolle.entity.js';

@Entity({ tableName: 'rollenerweiterung' })
@Unique({ properties: ['organisationId', 'rolleId', 'serviceProviderId'] })
export class RollenerweiterungEntity extends TimestampedEntity {
    @ManyToOne({ fieldName: 'organisation_id', entity: () => OrganisationEntity })
    @Index({ name: 'rolle_erweiterung_organisation_id_index', type: 'hash' })
    public organisationId!: Ref<OrganisationEntity>;

    @ManyToOne({ fieldName: 'rolle_id', entity: () => RolleEntity })
    @Index({ name: 'rolle_erweiterung_rolle_id_index', type: 'hash' })
    public rolleId!: Ref<RolleEntity>;

    @ManyToOne({ fieldName: 'service_provider_id', entity: () => ServiceProviderEntity })
    @Index({ name: 'rolle_erweiterung_service_provider_id_index', type: 'hash' })
    public serviceProviderId!: Ref<ServiceProviderEntity>;
}
