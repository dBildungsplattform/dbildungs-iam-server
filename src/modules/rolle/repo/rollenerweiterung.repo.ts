import { Loaded, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { OrganisationID, RolleID, ServiceProviderID } from '../../../shared/types/aggregate-ids.types.js';
import { PermittedOrgas, PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { RollenerweiterungFactory } from '../domain/rollenerweiterung.factory.js';
import { Rollenerweiterung } from '../domain/rollenerweiterung.js';
import { RollenSystemRecht } from '../domain/systemrecht.js';
import { RollenerweiterungEntity } from '../entity/rollenerweiterung.entity.js';
import { NoRedundantRollenerweiterungError } from '../specification/error/no-redundant-rollenerweiterung.error.js';
import { ServiceProviderNichtVerfuegbarFuerRollenerweiterungError } from '../specification/error/service-provider-nicht-verfuegbar-fuer-rollenerweiterung.error.js';
import { NoRedundantRollenerweiterung } from '../specification/no-redundant-rollenerweiterung.specification.js';
import { ServiceProviderVerfuegbarFuerRollenerweiterung } from '../specification/service-provider-verfuegbar-fuer-rollenerweiterung.specification.js';

type RollenerweiterungIds = {
    organisationId: OrganisationID;
    rolleId: RolleID;
    serviceProviderId: ServiceProviderID;
};

@Injectable()
export class RollenerweiterungRepo {
    public constructor(
        protected readonly em: EntityManager,
        protected readonly rollenerweiterungFactory: RollenerweiterungFactory,
    ) {}

    private mapAggregateToEntityData(
        rollenerweiterung: Rollenerweiterung<false>,
    ): RequiredEntityData<RollenerweiterungEntity> {
        return {
            organisationId: rollenerweiterung.organisationId,
            rolleId: rollenerweiterung.rolleId,
            serviceProviderId: rollenerweiterung.serviceProviderId,
        };
    }

    private mapEntityToAggregate(rollenerweiterung: RollenerweiterungEntity): Rollenerweiterung<true> {
        return this.rollenerweiterungFactory.construct(
            rollenerweiterung.id,
            rollenerweiterung.createdAt,
            rollenerweiterung.updatedAt,
            rollenerweiterung.organisationId.id,
            rollenerweiterung.rolleId.id,
            rollenerweiterung.serviceProviderId.id,
        );
    }

    public async exists({ organisationId, rolleId, serviceProviderId }: RollenerweiterungIds): Promise<boolean> {
        const count: number = await this.em.count(RollenerweiterungEntity, {
            organisationId: organisationId,
            rolleId: rolleId,
            serviceProviderId: serviceProviderId,
        });
        return count > 0;
    }

    public async create(rollenerweiterung: Rollenerweiterung<false>): Promise<Rollenerweiterung<true>> {
        const rollenerweiterungEntity: RollenerweiterungEntity = this.em.create(
            RollenerweiterungEntity,
            this.mapAggregateToEntityData(rollenerweiterung),
        );

        await this.em.persistAndFlush(rollenerweiterungEntity);

        return this.mapEntityToAggregate(rollenerweiterungEntity);
    }

    public async createAuthorized(
        rollenerweiterung: Rollenerweiterung<false>,
        permissions: PersonPermissions,
    ): Promise<Result<Rollenerweiterung<true>, DomainError>> {
        const permissionError: Option<MissingPermissionsError> = await this.checkPermissions(
            permissions,
            rollenerweiterung.organisationId,
        );
        if (permissionError) {
            return { ok: false, error: permissionError };
        }

        const referenceError: Option<EntityNotFoundError> = await rollenerweiterung.checkReferences();
        if (referenceError) {
            return { ok: false, error: referenceError };
        }

        const noRedundantRollenerweiterung: NoRedundantRollenerweiterung = new NoRedundantRollenerweiterung();
        if (!(await noRedundantRollenerweiterung.isSatisfiedBy(rollenerweiterung))) {
            return { ok: false, error: new NoRedundantRollenerweiterungError() };
        }

        const serviceProviderVerfuegbarFuerRollenerweiterung: ServiceProviderVerfuegbarFuerRollenerweiterung =
            new ServiceProviderVerfuegbarFuerRollenerweiterung();
        const result: boolean = await serviceProviderVerfuegbarFuerRollenerweiterung.isSatisfiedBy(rollenerweiterung);
        if (!result) {
            return { ok: false, error: new ServiceProviderNichtVerfuegbarFuerRollenerweiterungError() };
        }

        const rollenerweiterungEntity: RollenerweiterungEntity = this.em.create(
            RollenerweiterungEntity,
            this.mapAggregateToEntityData(rollenerweiterung),
        );
        await this.em.persistAndFlush(rollenerweiterungEntity);

        return {
            ok: true,
            value: this.mapEntityToAggregate(rollenerweiterungEntity),
        };
    }

    private async checkPermissions(
        permissions: PersonPermissions,
        organisationId: OrganisationID,
    ): Promise<Option<DomainError>> {
        const permittedOrgas: PermittedOrgas = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.ROLLEN_ERWEITERN],
            true,
        );
        if (permittedOrgas.all || permittedOrgas.orgaIds.includes(organisationId)) {
            return undefined;
        }
        return new MissingPermissionsError(`Missing systemrecht ${RollenSystemRecht.ROLLEN_ERWEITERN.name}.`);
    }

    public async findManyByOrganisationAndRolle(
        query: Array<Pick<Rollenerweiterung<boolean>, 'organisationId' | 'rolleId'>>,
    ): Promise<Rollenerweiterung<true>[]> {
        if (query.length === 0) {
            return [];
        }
        const rollenerweiterungen: Loaded<RollenerweiterungEntity>[] = await this.em.find(RollenerweiterungEntity, {
            $or: query,
        });
        return rollenerweiterungen.map((entity: Loaded<RollenerweiterungEntity>) => this.mapEntityToAggregate(entity));
    }

    public async findByServiceProviderIds(
        serviceProviderIds: ServiceProviderID[],
    ): Promise<Map<ServiceProviderID, Rollenerweiterung<true>[]>> {
        const rollenerweiterungEntities: Loaded<RollenerweiterungEntity>[] = await this.em.find(
            RollenerweiterungEntity,
            {
                serviceProviderId: { $in: serviceProviderIds },
            },
        );
        const rollenerweiterungen: Rollenerweiterung<true>[] = rollenerweiterungEntities.map(
            (entity: Loaded<RollenerweiterungEntity>) => this.mapEntityToAggregate(entity),
        );
        return new Map(
            serviceProviderIds.map((id: ServiceProviderID) => [
                id,
                rollenerweiterungen.filter(
                    (rollenerweiterung: Rollenerweiterung<true>) => rollenerweiterung.serviceProviderId === id,
                ),
            ]),
        );
    }

    /*
    Neither the organizations nor the roles are loaded directly here because:
    Otherwise, the organization and role would be included for every role extension (resulting in many duplicates).
    For performance reasons, it makes sense to create a separate set of IDs and load each one only once in a subsequent query without a join.
    */
    public async findByServiceProviderIdPagedAndSortedByOrgaKennung(
        serviceProviderId: ServiceProviderID,
        offset?: number,
        limit?: number,
    ): Promise<Counted<Rollenerweiterung<true>>> {
        // Step 1: Get paginated unique organisation IDs using raw SQL
        const pagedOrgIdsResult: {
            organisation_id: string;
        }[] = await this.em.execute<{ organisation_id: string }[]>(
            `SELECT DISTINCT re.organisation_id, o.kennung
         FROM rollenerweiterung re
         JOIN organisation o ON re.organisation_id = o.id
         WHERE re.service_provider_id = ?
         ORDER BY o.kennung ASC
         LIMIT ? OFFSET ?`,
            [serviceProviderId, limit ?? 999999, offset ?? 0],
        );

        const pagedOrgIds: string[] = pagedOrgIdsResult.map((row: { organisation_id: string }) => row.organisation_id);

        // Step 2: Count total unique organisations
        const countResult: {
            count: number;
        }[] = await this.em.execute<{ count: number }[]>(
            `SELECT COUNT(DISTINCT organisation_id) as count
         FROM rollenerweiterung
         WHERE service_provider_id = ?`,
            [serviceProviderId],
        );

        const totalUniqueOrgs: number = Number(countResult[0]?.count || 0);

        // Step 3: If no organisations found, return empty result
        if (pagedOrgIds.length === 0) {
            return [[], totalUniqueOrgs];
        }

        // Step 4: Get all rollenerweiterungen for the paginated organisations
        const [rollenerweiterungEntities]: Counted<Loaded<RollenerweiterungEntity>> = await this.em.findAndCount(
            RollenerweiterungEntity,
            {
                serviceProviderId,
                organisationId: { $in: pagedOrgIds },
            },
            {
                orderBy: {
                    organisationId: {
                        kennung: 'ASC',
                    },
                    id: 'ASC',
                },
            },
        );

        const rollenerweiterungen: Rollenerweiterung<true>[] = rollenerweiterungEntities.map(
            (entity: Loaded<RollenerweiterungEntity>) => this.mapEntityToAggregate(entity),
        );

        return [rollenerweiterungen, limit ?? totalUniqueOrgs];
    }
}
