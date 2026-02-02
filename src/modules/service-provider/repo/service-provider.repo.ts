import { EntityData, Loaded, RequiredEntityData } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

import { EventRoutingLegacyKafkaService } from '../../../core/eventbus/services/event-routing-legacy-kafka.service.js';
import { KafkaGroupAndRoleCreatedEvent } from '../../../shared/events/kafka-kc-group-and-role-event.js';
import { GroupAndRoleCreatedEvent } from '../../../shared/events/kc-group-and-role-event.js';
import { OrganisationID, RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { PermittedOrgas, PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { RollenSystemRecht } from '../../rolle/domain/systemrecht.js';
import { RolleServiceProviderEntity } from '../../rolle/entity/rolle-service-provider.entity.js';
import { ServiceProviderMerkmal } from '../domain/service-provider.enum.js';
import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderMerkmalEntity } from './service-provider-merkmal.entity.js';
import { ServiceProviderEntity } from './service-provider.entity.js';

/**
 * @deprecated Not for use outside of service-provider-repo, export will be removed at a later date
 */
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

function mapEntityToAggregate(entity: ServiceProviderEntity): ServiceProvider<boolean> {
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

type ServiceProviderFindOptions = {
    withLogo?: boolean;
};

@Injectable()
export class ServiceProviderRepo {
    public constructor(
        private readonly em: EntityManager,
        private readonly eventService: EventRoutingLegacyKafkaService,
    ) {}

    public async findById(id: string, options?: ServiceProviderFindOptions): Promise<Option<ServiceProvider<true>>> {
        const exclude: readonly ['logo'] | undefined = options?.withLogo ? undefined : ['logo'];

        const serviceProvider: Option<ServiceProviderEntity> = (await this.em.findOne(
            ServiceProviderEntity,
            { id },
            { exclude, populate: ['merkmale'] },
        )) as Option<ServiceProviderEntity>;

        return serviceProvider && mapEntityToAggregate(serviceProvider);
    }

    public async findByName(name: string): Promise<Option<ServiceProvider<true>>> {
        const serviceProvider: Option<ServiceProviderEntity> = await this.em.findOne(
            ServiceProviderEntity,
            {
                name: name,
            },
            { populate: ['merkmale'] },
        );
        if (serviceProvider) {
            return mapEntityToAggregate(serviceProvider);
        }

        return null;
    }

    public async findByVidisAngebotId(vidisAngebotId: string): Promise<Option<ServiceProvider<true>>> {
        const serviceProvider: Option<ServiceProviderEntity> = await this.em.findOne(
            ServiceProviderEntity,
            {
                vidisAngebotId: vidisAngebotId,
            },
            { populate: ['merkmale'] },
        );
        if (serviceProvider) {
            return mapEntityToAggregate(serviceProvider);
        }

        return null;
    }

    public async findByKeycloakGroup(groupname: string): Promise<ServiceProvider<true>[]> {
        const serviceProviders: ServiceProviderEntity[] = await this.em.find(
            ServiceProviderEntity,
            {
                keycloakGroup: groupname,
            },
            { populate: ['merkmale'] },
        );
        return serviceProviders.map(mapEntityToAggregate);
    }

    public async find(options?: ServiceProviderFindOptions): Promise<ServiceProvider<true>[]> {
        const exclude: readonly ['logo'] | undefined = options?.withLogo ? undefined : ['logo'];

        const serviceProviders: ServiceProviderEntity[] = (await this.em.findAll(ServiceProviderEntity, {
            exclude,
            populate: ['merkmale'],
        })) as ServiceProviderEntity[];

        return serviceProviders.map(mapEntityToAggregate);
    }

    public async findByIds(ids: string[]): Promise<Map<string, ServiceProvider<true>>> {
        const serviceProviderEntities: ServiceProviderEntity[] = await this.em.find(
            ServiceProviderEntity,
            { id: { $in: ids } },
            {
                populate: ['merkmale'],
            },
        );

        const serviceProviderMap: Map<string, ServiceProvider<true>> = new Map();
        serviceProviderEntities.forEach((serviceProviderEntity: ServiceProviderEntity) => {
            const serviceProvider: ServiceProvider<true> = mapEntityToAggregate(serviceProviderEntity);
            serviceProviderMap.set(serviceProviderEntity.id, serviceProvider);
        });

        return serviceProviderMap;
    }

    public async findAuthorized(
        permissions: PersonPermissions,
        limit?: number,
        offset?: number,
    ): Promise<Counted<ServiceProvider<true>>> {
        const permittedOrgas: PermittedOrgas = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.ANGEBOTE_VERWALTEN],
            true,
        );
        const [entities, count]: Counted<ServiceProviderEntity> = await this.em.findAndCount(
            ServiceProviderEntity,
            permittedOrgas.all
                ? {}
                : {
                      providedOnSchulstrukturknoten: { $in: permittedOrgas.orgaIds },
                  },
            {
                populate: ['merkmale'],
                limit,
                offset,
                orderBy: {
                    kategorie: 'ASC', // kategorie defines a custom order
                },
            },
        );

        return [entities.map(mapEntityToAggregate), count];
    }

    public async findByOrgasWithMerkmal(
        organisationIds: OrganisationID[],
        merkmal: ServiceProviderMerkmal,
        limit?: number,
        offset?: number,
    ): Promise<Counted<ServiceProvider<true>>> {
        const [entities, count]: Counted<ServiceProviderEntity> = await this.em.findAndCount(
            ServiceProviderEntity,
            {
                providedOnSchulstrukturknoten: { $in: organisationIds },
                merkmale: { merkmal: merkmal },
            },
            {
                populate: ['merkmale'],
                limit,
                offset,
                orderBy: {
                    kategorie: 'ASC', // kategorie defines a custom order
                },
            },
        );

        return [entities.map(mapEntityToAggregate), count];
    }

    public async findAuthorizedById(
        permissions: PersonPermissions,
        id: string,
    ): Promise<Option<ServiceProvider<true>>> {
        const permittedOrgas: PermittedOrgas = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.ANGEBOTE_VERWALTEN, RollenSystemRecht.ROLLEN_ERWEITERN],
            true,
        );
        const entity: Option<ServiceProviderEntity> = await this.em.findOne(
            ServiceProviderEntity,
            permittedOrgas.all
                ? { id }
                : {
                      id,
                      providedOnSchulstrukturknoten: { $in: permittedOrgas.orgaIds },
                  },
            {
                populate: ['merkmale'],
            },
        );
        return entity ? mapEntityToAggregate(entity) : entity;
    }

    public async findBySchulstrukturknoten(organisationsId: string): Promise<Array<ServiceProvider<true>>> {
        const exclude: readonly ['logo'] | undefined = ['logo'];
        return (
            await this.em.find(
                ServiceProviderEntity,
                { providedOnSchulstrukturknoten: organisationsId },
                {
                    populate: ['merkmale'],
                    exclude,
                },
            )
        ).map(mapEntityToAggregate);
    }

    public async save(serviceProvider: ServiceProvider<boolean>): Promise<ServiceProvider<true>> {
        if (serviceProvider.id) {
            return this.update(serviceProvider);
        } else {
            return this.create(serviceProvider);
        }
    }

    public async create(serviceProvider: ServiceProvider<false>): Promise<ServiceProvider<true>> {
        const serviceProviderEntity: ServiceProviderEntity = this.em.create(
            ServiceProviderEntity,
            mapAggregateToData(serviceProvider),
        );

        await this.em.persistAndFlush(serviceProviderEntity);

        if (serviceProviderEntity.keycloakGroup && serviceProviderEntity.keycloakRole) {
            this.eventService.publish(
                new GroupAndRoleCreatedEvent(serviceProviderEntity.keycloakGroup, serviceProviderEntity.keycloakRole),
                new KafkaGroupAndRoleCreatedEvent(
                    serviceProviderEntity.keycloakGroup,
                    serviceProviderEntity.keycloakRole,
                ),
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

    public async fetchRolleServiceProvidersWithoutPerson(
        rolleId: RolleID | RolleID[],
    ): Promise<ServiceProvider<true>[]> {
        const rolleServiceProviderEntities: RolleServiceProviderEntity[] = await this.em.find(
            RolleServiceProviderEntity,
            {
                rolle: {
                    id: Array.isArray(rolleId) ? { $in: rolleId } : rolleId,
                },
            },
            {
                populate: ['serviceProvider', 'serviceProvider.merkmale', 'rolle', 'rolle.personenKontexte'],
            },
        );

        const serviceProviders: ServiceProvider<true>[] = rolleServiceProviderEntities.map(
            (rolleServiceProviderEntity: RolleServiceProviderEntity) => {
                return mapEntityToAggregate(rolleServiceProviderEntity.serviceProvider);
            },
        );

        return serviceProviders;
    }

    public async deleteById(id: string): Promise<boolean> {
        const deletedPersons: number = await this.em.nativeDelete(ServiceProviderEntity, { id });
        return deletedPersons > 0;
    }

    public async deleteByName(name: string): Promise<boolean> {
        const deletedPersons: number = await this.em.nativeDelete(ServiceProviderEntity, { name: name });
        return deletedPersons > 0;
    }
}
