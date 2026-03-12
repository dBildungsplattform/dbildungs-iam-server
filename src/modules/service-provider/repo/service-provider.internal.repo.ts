import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ServiceProviderEntity } from './service-provider.entity.js';

@Injectable()
export class ServiceProviderInternalRepo {
    public constructor(private readonly em: EntityManager) {}

    public async existsDuplicateNameForOrganisation(name: string, organisationId: string): Promise<boolean> {
        const serviceProvider: Option<ServiceProviderEntity> = await this.em.findOne(ServiceProviderEntity, {
            providedOnSchulstrukturknoten: organisationId,
            name,
        });
        return !!serviceProvider;
    }
}
