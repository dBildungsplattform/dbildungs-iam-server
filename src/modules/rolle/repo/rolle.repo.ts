import { EntityData, EntityManager, EntityName, Loaded, RequiredEntityData } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

import { RollenMerkmal, RollenSystemRecht } from '../domain/rolle.enums.js';
import { Rolle } from '../domain/rolle.js';
import { RolleMerkmalEntity } from '../entity/rolle-merkmal.entity.js';
import { RolleEntity } from '../entity/rolle.entity.js';
import { RolleFactory } from '../domain/rolle.factory.js';
import { RolleServiceProviderEntity } from '../entity/rolle-service-provider.entity.js';
import { OrganisationID, RolleID } from '../../../shared/types/index.js';
import { RolleSystemrechtEntity } from '../entity/rolle-systemrecht.entity.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { DomainError, EntityNotFoundError, MissingPermissionsError } from '../../../shared/error/index.js';
import { UpdateMerkmaleError } from '../domain/update-merkmale.error.js';

/**
 * @deprecated Not for use outside of rolle-repo, export will be removed at a later date
 */
export function mapAggregateToData(rolle: Rolle<boolean>): RequiredEntityData<RolleEntity> {
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
    };
}

/**
 * @deprecated Not for use outside of rolle-repo, export will be removed at a later date
 */
export function mapEntityToAggregate(entity: RolleEntity, rolleFactory: RolleFactory): Rolle<boolean> {
    const merkmale: RollenMerkmal[] = entity.merkmale.map((merkmalEntity: RolleMerkmalEntity) => merkmalEntity.merkmal);
    const systemrechte: RollenSystemRecht[] = entity.systemrechte.map(
        (systemRechtEntity: RolleSystemrechtEntity) => systemRechtEntity.systemrecht,
    );

    const serviceProviderIds: string[] = entity.serviceProvider.map(
        (serviceProvider: RolleServiceProviderEntity) => serviceProvider.serviceProvider.id,
    );

    return rolleFactory.construct(
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.name,
        entity.administeredBySchulstrukturknoten,
        entity.rollenart,
        merkmale,
        systemrechte,
        serviceProviderIds,
    );
}

@Injectable()
export class RolleRepo {
    public static readonly DEFAULT_LIMIT: number = 25;

    public constructor(
        protected readonly rolleFactory: RolleFactory,
        protected readonly em: EntityManager,
    ) {}

    public get entityName(): EntityName<RolleEntity> {
        return RolleEntity;
    }

    public async findById(id: RolleID): Promise<Option<Rolle<true>>> {
        const rolle: Option<RolleEntity> = await this.em.findOne(
            this.entityName,
            { id },
            { populate: ['merkmale', 'systemrechte', 'serviceProvider'] as const },
        );

        return rolle && mapEntityToAggregate(rolle, this.rolleFactory);
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

        const organisationIDs: OrganisationID[] = await permissions.getOrgIdsWithSystemrecht(
            relevantSystemRechte,
            true,
        );
        if (organisationIDs.includes(rolleAdministeringOrganisationId)) {
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
                populate: ['merkmale', 'systemrechte', 'serviceProvider'] as const,
            },
        );

        const rollenMap: Map<string, Rolle<true>> = new Map();
        rollenEntities.forEach((rolleEntity: RolleEntity) => {
            const rolle: Rolle<true> = mapEntityToAggregate(rolleEntity, this.rolleFactory);
            rollenMap.set(rolleEntity.id, rolle);
        });

        return rollenMap;
    }

    public async findByName(searchStr: string, limit?: number, offset?: number): Promise<Option<Rolle<true>[]>> {
        const rollen: Option<RolleEntity[]> = await this.em.find(
            this.entityName,
            { name: { $ilike: '%' + searchStr + '%' } },
            { populate: ['merkmale', 'systemrechte', 'serviceProvider'] as const, limit: limit, offset: offset },
        );
        return rollen.map((rolle: RolleEntity) => mapEntityToAggregate(rolle, this.rolleFactory));
    }

    public async find(limit?: number, offset?: number): Promise<Rolle<true>[]> {
        const rollen: RolleEntity[] = await this.em.findAll(RolleEntity, {
            populate: ['merkmale', 'systemrechte', 'serviceProvider'] as const,
            limit: limit,
            offset: offset,
        });

        return rollen.map((rolle: RolleEntity) => mapEntityToAggregate(rolle, this.rolleFactory));
    }

    public async findRollenAuthorized(
        permissions: PersonPermissions,
        searchStr?: string,
        limit?: number,
        offset?: number,
    ): Promise<[Option<Rolle<true>[]>, number]> {
        const orgIdsWithRecht: OrganisationID[] = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.ROLLEN_VERWALTEN],
            true,
        );

        let rollen: Option<RolleEntity[]>;
        let total: number;
        const organisationWhereClause = { administeredBySchulstrukturknoten: { $in: orgIdsWithRecht } };
        if (searchStr) {
            [rollen, total] = await this.em.findAndCount(
                this.entityName,
                {
                    name: { $ilike: '%' + searchStr + '%' },
                    ...organisationWhereClause,
                },
                { populate: ['merkmale', 'systemrechte', 'serviceProvider'] as const, limit: limit, offset: offset },
            );
        } else {
            [rollen, total] = await this.em.findAndCount(
                this.entityName,
                { ...organisationWhereClause },
                {
                    populate: ['merkmale', 'systemrechte', 'serviceProvider'] as const,
                    limit: limit,
                    offset: offset,
                },
            );
        }
        if (total === 0) {
            return [[], 0];
        }

        return [rollen.map((rolle: RolleEntity) => mapEntityToAggregate(rolle, this.rolleFactory)), total];
    }

    public async exists(id: RolleID): Promise<boolean> {
        const rolle: Option<Loaded<RolleEntity, never, 'id', never>> = await this.em.findOne(
            RolleEntity,
            { id },
            { fields: ['id'] as const },
        );

        return !!rolle;
    }

    public async save(rolle: Rolle<boolean>): Promise<Rolle<true>> {
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
        isAlreadyAssigned: boolean,
        permissions: PersonPermissions,
    ): Promise<Rolle<true> | DomainError> {
        //Reference & Permissions
        const authorizedRole: Result<Rolle<true>, DomainError> = await this.findByIdAuthorized(id, permissions);
        if (!authorizedRole.ok) {
            return authorizedRole.error;
        }
        //Specifications
        {
            if (isAlreadyAssigned && (merkmale.length > 0 || merkmale.length < authorizedRole.value.merkmale.length)) {
                return new UpdateMerkmaleError();
            }
        }

        const updatedRolle: Rolle<true> | DomainError = await this.rolleFactory.update(
            id,
            authorizedRole.value.createdAt,
            authorizedRole.value.updatedAt,
            name,
            authorizedRole.value.administeredBySchulstrukturknoten,
            authorizedRole.value.rollenart,
            merkmale,
            systemrechte,
            serviceProviderIds,
        );

        if (updatedRolle instanceof DomainError) {
            return updatedRolle;
        }
        const result: Rolle<true> = await this.save(updatedRolle);
        return result;
    }

    private async create(rolle: Rolle<false>): Promise<Rolle<true>> {
        const rolleEntity: RolleEntity = this.em.create(RolleEntity, mapAggregateToData(rolle));

        await this.em.persistAndFlush(rolleEntity);

        return mapEntityToAggregate(rolleEntity, this.rolleFactory);
    }

    private async update(rolle: Rolle<true>): Promise<Rolle<true>> {
        const rolleEntity: Loaded<RolleEntity> = await this.em.findOneOrFail(RolleEntity, rolle.id, {
            populate: ['merkmale', 'systemrechte', 'serviceProvider'] as const,
        });
        rolleEntity.assign(mapAggregateToData(rolle), { updateNestedEntities: true });

        await this.em.persistAndFlush(rolleEntity);

        return mapEntityToAggregate(rolleEntity, this.rolleFactory);
    }
}
