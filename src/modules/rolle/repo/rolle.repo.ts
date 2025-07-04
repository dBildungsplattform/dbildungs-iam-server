import {
    EntityData,
    EntityManager,
    EntityName,
    ForeignKeyConstraintViolationException,
    Loaded,
    RequiredEntityData,
} from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

import { RollenArt, RollenMerkmal, RollenSystemRecht } from '../domain/rolle.enums.js';
import { Rolle } from '../domain/rolle.js';
import { RolleMerkmalEntity } from '../entity/rolle-merkmal.entity.js';
import { RolleEntity } from '../entity/rolle.entity.js';
import { RolleFactory } from '../domain/rolle.factory.js';
import { RolleServiceProviderEntity } from '../entity/rolle-service-provider.entity.js';
import { OrganisationID, RolleID } from '../../../shared/types/index.js';
import { RolleSystemrechtEntity } from '../entity/rolle-systemrecht.entity.js';
import { PermittedOrgas, PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { DomainError, EntityNotFoundError, MissingPermissionsError } from '../../../shared/error/index.js';
import { UpdateMerkmaleError } from '../domain/update-merkmale.error.js';
import { EventRoutingLegacyKafkaService } from '../../../core/eventbus/services/event-routing-legacy-kafka.service.js';
import { RolleUpdatedEvent } from '../../../shared/events/rolle-updated.event.js';
import { RolleHatPersonenkontexteError } from '../domain/rolle-hat-personenkontexte.error.js';

import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ServiceProviderEntity } from '../../service-provider/repo/service-provider.entity.js';
import { RolleUpdateOutdatedError } from '../domain/update-outdated.error.js';
import { RolleNameUniqueOnSsk } from '../specification/rolle-name-unique-on-ssk.js';
import { RolleNameNotUniqueOnSskError } from '../specification/error/rolle-name-not-unique-on-ssk.error.js';
import { KafkaRolleUpdatedEvent } from '../../../shared/events/kafka-rolle-updated.event.js';

export function mapRolleAggregateToData(rolle: Rolle<boolean>): RequiredEntityData<RolleEntity> {
    const merkmale: EntityData<RolleMerkmalEntity>[] = rolle.merkmale.map((merkmal: RollenMerkmal) => ({
        rolle: rolle.id,
        merkmal,
    }));

    const systemrechte: EntityData<RolleSystemrechtEntity>[] = rolle.systemrechte.map(
        (systemrecht: RollenSystemRecht) => ({
            rolle: rolle.id,
            systemrecht,
        }),
    );

    const serviceProvider: EntityData<RolleServiceProviderEntity>[] = rolle.serviceProviderIds.map((spId: string) => ({
        rolle: rolle.id,
        serviceProvider: spId,
    }));

    return {
        // Don't assign createdAt and updatedAt, they are auto-generated!
        id: rolle.id,
        name: rolle.name,
        administeredBySchulstrukturknoten: rolle.administeredBySchulstrukturknoten,
        rollenart: rolle.rollenart,
        merkmale,
        systemrechte,
        serviceProvider,
        istTechnisch: rolle.istTechnisch,
        version: rolle.version,
    };
}

export function mapRolleEntityToAggregate(entity: RolleEntity, rolleFactory: RolleFactory): Rolle<boolean> {
    const merkmale: RollenMerkmal[] = entity.merkmale.map((merkmalEntity: RolleMerkmalEntity) => merkmalEntity.merkmal);
    const systemrechte: RollenSystemRecht[] = entity.systemrechte.map(
        (systemRechtEntity: RolleSystemrechtEntity) => systemRechtEntity.systemrecht,
    );

    const serviceProviderIds: string[] = entity.serviceProvider.map(
        (serviceProvider: RolleServiceProviderEntity) => serviceProvider.serviceProvider.id,
    );

    const serviceProviderData: ServiceProvider<true>[] = entity.serviceProvider.map(
        (serviceProvider: RolleServiceProviderEntity) => {
            const sp: ServiceProviderEntity = serviceProvider.serviceProvider;
            return ServiceProvider.construct(
                sp.id,
                sp.createdAt,
                sp.updatedAt,
                sp.name,
                sp.target,
                sp.url,
                sp.kategorie,
                sp.providedOnSchulstrukturknoten,
                sp.logo,
                sp.logoMimeType,
                sp.keycloakGroup,
                sp.keycloakRole,
                sp.externalSystem,
                sp.requires2fa,
                sp.vidisAngebotId,
            );
        },
    );

    return rolleFactory.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.version,
        entity.name,
        entity.administeredBySchulstrukturknoten,
        entity.rollenart,
        merkmale,
        systemrechte,
        serviceProviderIds,
        entity.istTechnisch,
        serviceProviderData,
    );
}

@Injectable()
export class RolleRepo {
    public static readonly DEFAULT_LIMIT: number = 25;

    public constructor(
        protected readonly rolleFactory: RolleFactory,
        private readonly eventService: EventRoutingLegacyKafkaService,
        protected readonly em: EntityManager,
    ) {}

    public get entityName(): EntityName<RolleEntity> {
        return RolleEntity;
    }

    public async findById(id: RolleID, includeTechnical: boolean = false): Promise<Option<Rolle<true>>> {
        const query: { id: RolleID; istTechnisch?: boolean } = includeTechnical ? { id } : { id, istTechnisch: false };

        const rolle: Option<RolleEntity> = await this.em.findOne(this.entityName, query, {
            populate: ['merkmale', 'systemrechte', 'serviceProvider.serviceProvider'] as const,
            exclude: ['serviceProvider.serviceProvider.logo'] as const,
        });

        return rolle && mapRolleEntityToAggregate(rolle, this.rolleFactory);
    }

    public async findByIdAuthorized(
        rolleId: RolleID,
        permissions: PersonPermissions,
    ): Promise<Result<Rolle<true>, DomainError>> {
        const rolle: Option<Rolle<true>> = await this.findById(rolleId);
        if (!rolle) {
            return {
                ok: false,
                error: new EntityNotFoundError(),
            };
        }

        const rolleAdministeringOrganisationId: OrganisationID = rolle.administeredBySchulstrukturknoten;

        const relevantSystemRechte: RollenSystemRecht[] = [RollenSystemRecht.ROLLEN_VERWALTEN];

        const permittedOrgas: PermittedOrgas = await permissions.getOrgIdsWithSystemrecht(relevantSystemRechte, true);
        if (permittedOrgas.all || permittedOrgas.orgaIds.includes(rolleAdministeringOrganisationId)) {
            return {
                ok: true,
                value: rolle,
            };
        }
        return {
            ok: false,
            error: new MissingPermissionsError('Not allowed to view the requested rolle.'),
        };
    }

    public async findByIds(ids: RolleID[]): Promise<Map<string, Rolle<true>>> {
        const rollenEntities: RolleEntity[] = await this.em.find(
            RolleEntity,
            { id: { $in: ids } },
            {
                populate: ['merkmale', 'systemrechte', 'serviceProvider.serviceProvider'] as const,
                exclude: ['serviceProvider.serviceProvider.logo'] as const,
            },
        );

        const rollenMap: Map<string, Rolle<true>> = new Map();
        rollenEntities.forEach((rolleEntity: RolleEntity) => {
            const rolle: Rolle<true> = mapRolleEntityToAggregate(rolleEntity, this.rolleFactory);
            rollenMap.set(rolleEntity.id, rolle);
        });

        return rollenMap;
    }

    public async findByName(
        searchStr: string,
        includeTechnische: boolean,
        limit?: number,
        offset?: number,
        rollenarten?: RollenArt[],
    ): Promise<Rolle<true>[]> {
        const technischeQuery: { istTechnisch?: false } = includeTechnische ? {} : { istTechnisch: false };
        const rollenartQuery: Record<string, unknown> =
            rollenarten && rollenarten.length > 0 ? { rollenart: { $in: rollenarten } } : {};

        const rollen: RolleEntity[] = await this.em.find(
            this.entityName,
            { name: { $ilike: '%' + searchStr + '%' }, ...rollenartQuery, ...technischeQuery },
            {
                populate: ['merkmale', 'systemrechte', 'serviceProvider.serviceProvider'] as const,
                exclude: ['serviceProvider.serviceProvider.logo'] as const,
                limit: limit,
                offset: offset,
            },
        );
        return rollen.map((rolle: RolleEntity) => mapRolleEntityToAggregate(rolle, this.rolleFactory));
    }

    public async find(
        includeTechnische: boolean,
        limit?: number,
        offset?: number,
        rollenarten?: RollenArt[],
    ): Promise<Rolle<true>[]> {
        const technischeQuery: { istTechnisch?: false } = includeTechnische ? {} : { istTechnisch: false };
        const rollenartQuery: Record<string, unknown> =
            rollenarten && rollenarten.length > 0 ? { rollenart: { $in: rollenarten } } : {};

        const rollen: RolleEntity[] = await this.em.findAll(RolleEntity, {
            populate: ['merkmale', 'systemrechte', 'serviceProvider.serviceProvider'] as const,
            exclude: ['serviceProvider.serviceProvider.logo'] as const,
            where: { ...technischeQuery, ...rollenartQuery },
            limit: limit,
            offset: offset,
        });

        return rollen.map((rolle: RolleEntity) => mapRolleEntityToAggregate(rolle, this.rolleFactory));
    }

    public async findRollenAuthorized(
        permissions: PersonPermissions,
        includeTechnische: boolean,
        searchStr?: string,
        limit?: number,
        offset?: number,
    ): Promise<[Option<Rolle<true>[]>, number]> {
        const orgIdsWithRecht: PermittedOrgas = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.ROLLEN_VERWALTEN],
            true,
        );

        if (!orgIdsWithRecht.all && orgIdsWithRecht.orgaIds.length == 0) {
            return [[], 0];
        }

        const technischeQuery: { istTechnisch?: false } = includeTechnische ? {} : { istTechnisch: false };

        const [rollen, total]: [Option<RolleEntity[]>, number] = await this.em.findAndCount(
            this.entityName,
            {
                ...(searchStr ? { name: { $ilike: '%' + searchStr + '%' } } : {}),
                ...technischeQuery,
                ...(orgIdsWithRecht.all ? {} : { administeredBySchulstrukturknoten: { $in: orgIdsWithRecht.orgaIds } }),
            },
            {
                populate: ['merkmale', 'systemrechte', 'serviceProvider.serviceProvider'] as const,
                exclude: ['serviceProvider.serviceProvider.logo'] as const,
                limit: limit,
                offset: offset,
            },
        );

        if (total === 0) {
            return [[], 0];
        }

        return [rollen.map((rolle: RolleEntity) => mapRolleEntityToAggregate(rolle, this.rolleFactory)), total];
    }

    public async exists(id: RolleID): Promise<boolean> {
        const rolle: Option<Loaded<RolleEntity, never, 'id', never>> = await this.em.findOne(
            RolleEntity,
            { id },
            { fields: ['id'] as const },
        );

        return !!rolle;
    }

    public async save(rolle: Rolle<boolean>): Promise<Rolle<true> | DomainError> {
        const rolleNameUniqueOnSSK: RolleNameUniqueOnSsk = new RolleNameUniqueOnSsk(this, rolle.name);
        if (!(await rolleNameUniqueOnSSK.isSatisfiedBy(rolle))) return new RolleNameNotUniqueOnSskError();

        if (rolle.id) {
            return this.update(rolle);
        } else {
            return this.create(rolle);
        }
    }

    public async updateRolleAuthorized(
        id: string,
        name: string,
        merkmale: RollenMerkmal[],
        systemrechte: RollenSystemRecht[],
        serviceProviderIds: string[],
        version: number,
        isAlreadyAssigned: boolean,
        permissions: PersonPermissions,
    ): Promise<Rolle<true> | DomainError> {
        //Reference & Permissions
        const authorizedRoleResult: Result<Rolle<true>, DomainError> = await this.findByIdAuthorized(id, permissions);
        if (!authorizedRoleResult.ok) {
            return authorizedRoleResult.error;
        }
        //Specifications
        if (
            isAlreadyAssigned &&
            (merkmale.length > 0 || merkmale.length < authorizedRoleResult.value.merkmale.length)
        ) {
            return new UpdateMerkmaleError();
        }

        const authorizedRole: Rolle<true> = authorizedRoleResult.value;

        const updatedRolle: Rolle<true> | DomainError = await this.rolleFactory.update(
            id,
            authorizedRole.createdAt,
            authorizedRole.updatedAt,
            version,
            name,
            authorizedRole.administeredBySchulstrukturknoten,
            authorizedRole.rollenart,
            merkmale,
            systemrechte,
            serviceProviderIds,
            authorizedRole.istTechnisch,
        );

        if (updatedRolle instanceof DomainError) {
            return updatedRolle;
        }
        const result: Rolle<true> | DomainError = await this.save(updatedRolle);
        if (result instanceof DomainError) {
            return result;
        }

        return result;
    }

    public async deleteAuthorized(id: RolleID, permissions: PersonPermissions): Promise<Option<DomainError>> {
        //Permissions
        const authorizedRole: Result<Rolle<true>, DomainError> = await this.findByIdAuthorized(id, permissions);
        if (!authorizedRole.ok) {
            return authorizedRole.error;
        }

        const rolleEntity: Loaded<RolleEntity> = await this.em.findOneOrFail(RolleEntity, id, {
            populate: ['merkmale', 'systemrechte', 'serviceProvider.serviceProvider'] as const,
            exclude: ['serviceProvider.serviceProvider.logo'] as const,
        });

        try {
            //Cascade removal
            await this.em.removeAndFlush(rolleEntity);
        } catch (ex) {
            if (ex instanceof ForeignKeyConstraintViolationException) {
                return new RolleHatPersonenkontexteError();
            }
        }

        return;
    }

    public async create(rolle: Rolle<false>): Promise<Rolle<true>> {
        const rolleEntity: RolleEntity = this.em.create(RolleEntity, mapRolleAggregateToData(rolle));

        await this.em.persistAndFlush(rolleEntity);

        return mapRolleEntityToAggregate(rolleEntity, this.rolleFactory);
    }

    private async update(rolle: Rolle<true>): Promise<Rolle<true>> {
        const rolleEntity: Loaded<RolleEntity> = await this.em.findOneOrFail(RolleEntity, rolle.id, {
            populate: ['merkmale', 'systemrechte', 'serviceProvider.serviceProvider'] as const,
            exclude: ['serviceProvider.serviceProvider.logo'] as const,
        });

        if (rolleEntity.version !== rolle.version) {
            throw new RolleUpdateOutdatedError();
        }
        rolle.version = rolle.version + 1;

        const oldRolle: Rolle<true> = mapRolleEntityToAggregate(rolleEntity, this.rolleFactory);

        rolleEntity.assign(mapRolleAggregateToData(rolle), { updateNestedEntities: true });
        await this.em.persistAndFlush(rolleEntity);

        const updatedRolle: Rolle<true> = mapRolleEntityToAggregate(rolleEntity, this.rolleFactory);
        this.eventService.publish(
            RolleUpdatedEvent.fromRollen(updatedRolle, oldRolle),
            KafkaRolleUpdatedEvent.fromRollen(updatedRolle, oldRolle),
        );

        return updatedRolle;
    }
}
