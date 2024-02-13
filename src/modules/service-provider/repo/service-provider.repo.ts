import { EntityManager, Loaded, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderEntity } from './service-provider.entity.js';

function mapAggregateToData(
    serviceProvider: ServiceProvider<boolean, true>,
): RequiredEntityData<ServiceProviderEntity> {
    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: serviceProvider.id,
        name: serviceProvider.name,
        url: serviceProvider.url,
        kategorie: serviceProvider.kategorie,
        logoMimeType: serviceProvider.logoMimeType,
        logo: serviceProvider.logo,
        providedOnSchulstrukturknoten: serviceProvider.providedOnSchulstrukturknoten,
    };
}

function mapEntityToAggregate(entity: ServiceProviderEntity): ServiceProvider<boolean, boolean> {
    return ServiceProvider.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.name,
        entity.url,
        entity.kategorie,
        entity.logoMimeType,
        entity.logo,
        entity.providedOnSchulstrukturknoten,
    );
}

@Injectable()
export class ServiceProviderRepo {
    public constructor(private readonly em: EntityManager) {}

    public async findById<WithLogo extends boolean>(
        id: string,
        loadLogo: WithLogo,
    ): Promise<Option<ServiceProvider<true, WithLogo>>> {
        const exclude: readonly ['logo'] | undefined = loadLogo ? undefined : ['logo'];

        const serviceProvider: Option<ServiceProviderEntity> = (await this.em.findOne(
            ServiceProviderEntity,
            { id },
            { exclude },
        )) as Option<ServiceProviderEntity>;

        return serviceProvider && mapEntityToAggregate(serviceProvider);
    }

    public async find<WithLogo extends boolean>(loadLogo: WithLogo): Promise<ServiceProvider<true, WithLogo>[]> {
        const exclude: readonly ['logo'] | undefined = loadLogo ? undefined : ['logo'];

        const serviceProviders: ServiceProviderEntity[] = (await this.em.findAll(ServiceProviderEntity, {
            exclude,
        })) as ServiceProviderEntity[];

        return serviceProviders.map(mapEntityToAggregate);
    }

    public async save(serviceProvider: ServiceProvider<boolean, true>): Promise<ServiceProvider<true, true>> {
        if (serviceProvider.id) {
            return this.update(serviceProvider);
        } else {
            return this.create(serviceProvider);
        }
    }

    private async create(serviceProvider: ServiceProvider<false, true>): Promise<ServiceProvider<true, true>> {
        const serviceProviderEntity: ServiceProviderEntity = this.em.create(
            ServiceProviderEntity,
            mapAggregateToData(serviceProvider),
        );

        await this.em.persistAndFlush(serviceProviderEntity);

        return mapEntityToAggregate(serviceProviderEntity);
    }

    private async update(serviceProvider: ServiceProvider<true, true>): Promise<ServiceProvider<true, true>> {
        const serviceProviderEntity: Loaded<ServiceProviderEntity> = await this.em.findOneOrFail(
            ServiceProviderEntity,
            serviceProvider.id,
        );
        serviceProviderEntity.assign(mapAggregateToData(serviceProvider));

        await this.em.persistAndFlush(serviceProviderEntity);

        return mapEntityToAggregate(serviceProviderEntity);
    }
}
