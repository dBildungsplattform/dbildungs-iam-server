import { Injectable } from '@nestjs/common';
import { Organisation } from '../../organisation/domain/organisation.js';
import { ServiceProvider } from '../domain/service-provider.js';
import { EntityManager, RequiredEntityData } from '@mikro-orm/postgresql';
import { OrganisationServiceProviderEntity } from './organisation-service-provider.entity.js';

@Injectable()
export class OrganisationServiceProviderRepo {
    public constructor(private readonly em: EntityManager) {}

    public async save(organisation: Organisation<boolean>, serviceProvider: ServiceProvider<boolean>): Promise<void> {
        await this.create(organisation, serviceProvider);
    }

    private async create(organisation: Organisation<true>, serviceProvider: ServiceProvider<true>): Promise<void> {
        const entityData: RequiredEntityData<OrganisationServiceProviderEntity> = {
            organisation: organisation.id,
            serviceProvider: serviceProvider.id,
        };

        const organisationServiceProviderEntity: OrganisationServiceProviderEntity = this.em.create(
            OrganisationServiceProviderEntity,
            entityData,
        );

        await this.em.persistAndFlush(organisationServiceProviderEntity);
    }

    public async deleteAll(): Promise<boolean> {
        const deletedMappings: number = await this.em.nativeDelete(OrganisationServiceProviderEntity, {});
        return deletedMappings > 0;
    }
}
