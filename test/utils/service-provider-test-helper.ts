import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { ServiceProvider } from '../../src/modules/service-provider/domain/service-provider.js';
import { ServiceProviderEntity } from '../../src/modules/service-provider/repo/service-provider.entity.js';
import { mapEntityToAggregate } from '../../src/modules/service-provider/repo/service-provider-entity-mapper.js';
import { DoFactory } from './do-factory.js';

export async function createAndPersistServiceProvider(
    em: EntityManager,
    serviceProviderPartial?: Partial<ServiceProvider<false>>,
): Promise<ServiceProvider<true>> {
    const serviceProvider: ServiceProvider<false> = DoFactory.createServiceProvider(false, serviceProviderPartial);
    const serviceProviderData: RequiredEntityData<ServiceProviderEntity> = {
        name: serviceProvider.name,
        target: serviceProvider.target,
        providedOnSchulstrukturknoten: serviceProvider.providedOnSchulstrukturknoten,
        kategorie: serviceProvider.kategorie,
        externalSystem: serviceProvider.externalSystem,
        requires2fa: serviceProvider.requires2fa,
        logo: serviceProvider.logo,
        logoMimeType: serviceProvider.logoMimeType,
        keycloakGroup: serviceProvider.keycloakGroup,
        keycloakRole: serviceProvider.keycloakRole,
        url: serviceProvider.url,
    };
    const serviceProviderEntity: ServiceProviderEntity = em.create(ServiceProviderEntity, serviceProviderData);
    await em.persistAndFlush(serviceProviderEntity);

    return mapEntityToAggregate(serviceProviderEntity);
}
