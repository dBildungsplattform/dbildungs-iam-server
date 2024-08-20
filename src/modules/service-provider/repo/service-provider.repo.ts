import { EntityManager, Loaded, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderEntity } from './service-provider.entity.js';
import { CreateGroupAndRoleEvent } from '../../../shared/events/kc-group-and-role-event.js';
import { EventService } from '../../../core/eventbus/index.js';

import { RolleServiceProviderEntity } from '../../rolle/entity/rolle-service-provider.entity.js';

/**
 * @deprecated Not for use outside of service-provider-repo, export will be removed at a later date
 */
export function mapAggregateToData(
    serviceProvider: ServiceProvider<boolean>,
): RequiredEntityData<ServiceProviderEntity> {
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
    };
}

function mapEntityToAggregate(entity: ServiceProviderEntity): ServiceProvider<boolean> {
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
    );
}

type ServiceProviderFindOptions = {
    withLogo?: boolean;
};

type FetchRolleServiceProvidersParams = {
    personId: string;
    rolleId: string;
    excludeRolleId?: boolean;
};

@Injectable()
export class ServiceProviderRepo {
    public constructor(
        private readonly em: EntityManager,
        private readonly eventService: EventService,
    ) {}

    public async findById(id: string, options?: ServiceProviderFindOptions): Promise<Option<ServiceProvider<true>>> {
        const exclude: readonly ['logo'] | undefined = options?.withLogo ? undefined : ['logo'];

        const serviceProvider: Option<ServiceProviderEntity> = (await this.em.findOne(
            ServiceProviderEntity,
            { id },
            { exclude },
        )) as Option<ServiceProviderEntity>;

        return serviceProvider && mapEntityToAggregate(serviceProvider);
    }

    public async find(options?: ServiceProviderFindOptions): Promise<ServiceProvider<true>[]> {
        const exclude: readonly ['logo'] | undefined = options?.withLogo ? undefined : ['logo'];

        const serviceProviders: ServiceProviderEntity[] = (await this.em.findAll(ServiceProviderEntity, {
            exclude,
        })) as ServiceProviderEntity[];

        return serviceProviders.map(mapEntityToAggregate);
    }

    public async findByIds(ids: string[]): Promise<Map<string, ServiceProvider<true>>> {
        const serviceProviderEntities: ServiceProviderEntity[] = await this.em.find(
            ServiceProviderEntity,
            { id: { $in: ids } },
            {},
        );

        const serviceProviderMap: Map<string, ServiceProvider<true>> = new Map();
        serviceProviderEntities.forEach((serviceProviderEntity: ServiceProviderEntity) => {
            const serviceProvider: ServiceProvider<true> = mapEntityToAggregate(serviceProviderEntity);
            serviceProviderMap.set(serviceProviderEntity.id, serviceProvider);
        });

        return serviceProviderMap;
    }

    public async save(serviceProvider: ServiceProvider<boolean>): Promise<ServiceProvider<true>> {
        if (serviceProvider.id) {
            return this.update(serviceProvider);
        } else {
            return this.create(serviceProvider);
        }
    }

    private async create(serviceProvider: ServiceProvider<false>): Promise<ServiceProvider<true>> {
        const serviceProviderEntity: ServiceProviderEntity = this.em.create(
            ServiceProviderEntity,
            mapAggregateToData(serviceProvider),
        );

        await this.em.persistAndFlush(serviceProviderEntity);

        if (serviceProviderEntity.keycloakGroup && serviceProviderEntity.keycloakRole) {
            this.eventService.publish(
                new CreateGroupAndRoleEvent(serviceProviderEntity.keycloakGroup, serviceProviderEntity.keycloakRole),
            );
        }

        return mapEntityToAggregate(serviceProviderEntity);
    }

    private async update(serviceProvider: ServiceProvider<true>): Promise<ServiceProvider<true>> {
        const serviceProviderEntity: Loaded<ServiceProviderEntity> = await this.em.findOneOrFail(
            ServiceProviderEntity,
            serviceProvider.id,
        );
        serviceProviderEntity.assign(mapAggregateToData(serviceProvider));

        await this.em.persistAndFlush(serviceProviderEntity);

        return mapEntityToAggregate(serviceProviderEntity);
    }

    public async fetchRolleServiceProviders(
        params: FetchRolleServiceProvidersParams,
    ): Promise<RolleServiceProviderEntity[]> {
        const { personId, rolleId, excludeRolleId = false }: FetchRolleServiceProvidersParams = params;

        return this.em.find(
            RolleServiceProviderEntity,
            {
                rolle: {
                    id: excludeRolleId ? { $ne: rolleId } : rolleId,
                    personenKontexte: {
                        personId: personId,
                    },
                },
            },
            {
                populate: ['serviceProvider', 'rolle', 'rolle.personenKontexte'],
            },
        );
    }
}
