import { Loaded } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { EventRoutingLegacyKafkaService } from '../../../core/eventbus/services/event-routing-legacy-kafka.service.js';
import { KafkaGroupAndRoleCreatedEvent } from '../../../shared/events/kafka-kc-group-and-role-event.js';
import { GroupAndRoleCreatedEvent } from '../../../shared/events/kc-group-and-role-event.js';
import { OrganisationID, RolleID, ServiceProviderID } from '../../../shared/types/aggregate-ids.types.js';
import { PermittedOrgas, PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { RollenSystemRecht } from '../../rolle/domain/systemrecht.js';
import { RolleServiceProviderEntity } from '../../rolle/entity/rolle-service-provider.entity.js';
import { ServiceProviderKategorie, ServiceProviderMerkmal } from '../domain/service-provider.enum.js';
import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderEntity } from './service-provider.entity.js';
import { Err, Ok } from '../../../shared/util/result.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { IPersonPermissions } from '../../../shared/permissions/person-permissions.interface.js';
import { DuplicateNameError } from '../specification/error/duplicate-name.error.js';
import { ServiceProviderInternalRepo } from './service-provider.internal.repo.js';
import { DuplicateNameSpecification } from '../specification/duplicate-name.specification.js';
import { mapAggregateToData, mapEntityToAggregate } from './service-provider-entity-mapper.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityCouldNotBeCreated } from '../../../shared/error/entity-could-not-be-created.error.js';
import { EntityCouldNotBeUpdated } from '../../../shared/error/entity-could-not-be-updated.error.js';

type ServiceProviderFindOptions = {
    withLogo?: boolean;
};

type SPWithMerkmale = Loaded<ServiceProviderEntity, 'merkmale'>;

@Injectable()
export class ServiceProviderRepo {
    public constructor(
        private readonly em: EntityManager,
        private readonly eventService: EventRoutingLegacyKafkaService,
        private readonly serviceProviderInternalRepo: ServiceProviderInternalRepo,
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

    public async findByOrganisationsWithMerkmale(
        orgaIds: OrganisationID[] | 'all',
        limit?: number,
        offset?: number,
    ): Promise<Counted<ServiceProvider<true>>> {
        const [entities, count]: Counted<ServiceProviderEntity> = await this.em.findAndCount(
            ServiceProviderEntity,
            orgaIds === 'all' ? {} : { providedOnSchulstrukturknoten: { $in: orgaIds } },
            {
                populate: ['merkmale'],
                limit,
                offset,
                orderBy: { kategorie: 'ASC' },
            },
        );

        const serviceProviders: ServiceProvider<true>[] = entities.map(mapEntityToAggregate);
        return [serviceProviders, count];
    }

    public async findByIdForOrganisationIds(
        id: ServiceProviderID,
        organisationIds: OrganisationID[],
    ): Promise<Option<ServiceProvider<true>>> {
        const entity: SPWithMerkmale | null = await this.em.findOne(
            ServiceProviderEntity,
            {
                id,
                providedOnSchulstrukturknoten: { $in: organisationIds },
            },
            {
                populate: ['merkmale'],
            },
        );

        if (!entity) {
            return null;
        }

        return mapEntityToAggregate(entity);
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
            false,
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

    public async save(
        permissions: IPersonPermissions,
        serviceProvider: ServiceProvider<boolean>,
    ): Promise<Result<ServiceProvider<true>, DomainError>> {
        const permissionResult: Result<void, DomainError> = await this.checkPermissionsForServiceProvider(
            permissions,
            serviceProvider,
        );
        if (!permissionResult.ok) {
            return permissionResult;
        }

        if (!(await new DuplicateNameSpecification(this.serviceProviderInternalRepo).isSatisfiedBy(serviceProvider))) {
            return Err(
                new DuplicateNameError(
                    `Duplicate name error: ${serviceProvider.name}`,
                    serviceProvider.id || undefined,
                ),
            );
        }

        if (serviceProvider.id) {
            return await this.update(serviceProvider);
        } else {
            return await this.createInternal(serviceProvider);
        }
    }

    // TODO check permissions. Currently required by db-seed. Refactor once we have permissions for seeding.
    public async create(serviceProvider: ServiceProvider<false>): Promise<ServiceProvider<true>> {
        // const permissionResult: Result<void> = await this.checkPermissionsForServiceProvider(
        //     permissions,
        //     serviceProvider,
        // );
        // if (!permissionResult.ok) {
        //     throw permissionResult.error;
        // }
        const serviceProviderResult: Result<ServiceProvider<true>> = await this.createInternal(serviceProvider);
        if (!serviceProviderResult.ok) {
            throw serviceProviderResult.error;
        }
        return serviceProviderResult.value;
    }

    private async createInternal(
        serviceProvider: ServiceProvider<false>,
    ): Promise<Result<ServiceProvider<true>, DomainError>> {
        try {
            const serviceProviderEntity: ServiceProviderEntity = this.em.create(
                ServiceProviderEntity,
                mapAggregateToData(serviceProvider),
            );

            await this.em.persistAndFlush(serviceProviderEntity);

            if (serviceProviderEntity.keycloakGroup && serviceProviderEntity.keycloakRole) {
                this.eventService.publish(
                    new GroupAndRoleCreatedEvent(
                        serviceProviderEntity.keycloakGroup,
                        serviceProviderEntity.keycloakRole,
                    ),
                    new KafkaGroupAndRoleCreatedEvent(
                        serviceProviderEntity.keycloakGroup,
                        serviceProviderEntity.keycloakRole,
                    ),
                );
            }
            return Ok(mapEntityToAggregate(serviceProviderEntity));
        } catch (error) {
            return Err(new EntityCouldNotBeCreated('ServiceProvider', [error]));
        }
    }

    private async update(serviceProvider: ServiceProvider<true>): Promise<Result<ServiceProvider<true>, DomainError>> {
        const serviceProviderEntity: Loaded<ServiceProviderEntity> | null = await this.em.findOne(
            ServiceProviderEntity,
            serviceProvider.id,
        );
        if (!serviceProviderEntity) {
            return Err(new EntityNotFoundError('ServiceProvider', serviceProvider.id));
        }
        serviceProviderEntity.assign(mapAggregateToData(serviceProvider));

        try {
            await this.em.persistAndFlush(serviceProviderEntity);
        } catch (error) {
            return Err(new EntityCouldNotBeUpdated('ServiceProvider', serviceProvider.id, [error]));
        }
        return Ok(mapEntityToAggregate(serviceProviderEntity));
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

    private async checkPermissionsForServiceProvider(
        permissions: IPersonPermissions,
        serviceProvider: ServiceProvider<boolean>,
    ): Promise<Result<void, DomainError>> {
        if (
            !(await permissions.hasSystemrechtAtOrganisation(
                serviceProvider.providedOnSchulstrukturknoten,
                RollenSystemRecht.ANGEBOTE_VERWALTEN,
            ))
        ) {
            this.setDefaults(serviceProvider);
            if (
                !(await permissions.hasSystemrechtAtOrganisation(
                    serviceProvider.providedOnSchulstrukturknoten,
                    RollenSystemRecht.ANGEBOTE_VERWALTEN,
                ))
            ) {
                return Err(
                    new MissingPermissionsError('Not authorized to manage Service Providers at this organisation!'),
                );
            }
        }
        return Ok(undefined);
    }

    private setDefaults<T extends boolean>(serviceProvider: ServiceProvider<T>): ServiceProvider<T> {
        serviceProvider.merkmale = [
            ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG,
            ServiceProviderMerkmal.NACHTRAEGLICH_ZUWEISBAR,
        ];
        serviceProvider.requires2fa = false;
        serviceProvider.kategorie = ServiceProviderKategorie.SCHULISCH;
        return serviceProvider;
    }
}
