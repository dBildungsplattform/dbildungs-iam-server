import { EntityData, RequiredEntityData } from '@mikro-orm/core';
import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderEntity } from './service-provider.entity.js';
import { ServiceProviderMerkmalEntity } from './service-provider-merkmal.entity.js';
import { ServiceProviderMerkmal } from '../domain/service-provider.enum.js';

export function mapAggregateToData(
    serviceProvider: ServiceProvider<boolean>,
): RequiredEntityData<ServiceProviderEntity> {
    const merkmale: EntityData<ServiceProviderMerkmalEntity>[] = serviceProvider.merkmale.map(
        (merkmal: ServiceProviderMerkmal) => ({
            serviceProvider: serviceProvider.id,
            merkmal,
        }),
    );

    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: serviceProvider.id,
        name: serviceProvider.name,
        target: serviceProvider.target,
        url: serviceProvider.url,
        kategorie: serviceProvider.kategorie,
        providedOnSchulstrukturknoten: serviceProvider.providedOnSchulstrukturknoten,
        logo: serviceProvider.logo,
        logoMimeType: serviceProvider.logoMimeType,
        keycloakGroup: serviceProvider.keycloakGroup,
        keycloakRole: serviceProvider.keycloakRole,
        externalSystem: serviceProvider.externalSystem,
        requires2fa: serviceProvider.requires2fa,
        vidisAngebotId: serviceProvider.vidisAngebotId,
        merkmale,
    };
}

export function mapEntityToAggregate(entity: ServiceProviderEntity): ServiceProvider<boolean> {
    const merkmale: ServiceProviderMerkmal[] = entity.merkmale.map(
        (merkmalEntity: ServiceProviderMerkmalEntity) => merkmalEntity.merkmal,
    );

    return ServiceProvider.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.name,
        entity.target,
        entity.url,
        entity.kategorie,
        entity.providedOnSchulstrukturknoten,
        entity.logo,
        entity.logoMimeType,
        entity.keycloakGroup,
        entity.keycloakRole,
        entity.externalSystem,
        entity.requires2fa,
        entity.vidisAngebotId,
        merkmale,
    );
}
