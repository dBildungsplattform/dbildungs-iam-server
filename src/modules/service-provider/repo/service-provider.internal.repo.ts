import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ServiceProviderEntity } from './service-provider.entity.js';
import { OrganisationID, ServiceProviderID } from '../../../shared/types/aggregate-ids.types.js';

@Injectable()
export class ServiceProviderInternalRepo {
    public constructor(private readonly em: EntityManager) {}

    public async existsDuplicateNameForOrganisation(
        name: string,
        organisationId: OrganisationID,
        ignoreSpId: Option<ServiceProviderID>,
    ): Promise<boolean> {
        const serviceProvider: Option<ServiceProviderEntity> = await this.em.findOne(ServiceProviderEntity, {
            providedOnSchulstrukturknoten: organisationId,
            name,
            id: {
                $ne: ignoreSpId,
            },
        });
        return !!serviceProvider;
    }
}
