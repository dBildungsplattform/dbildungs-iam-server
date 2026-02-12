import { Loaded, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EntityManager, QueryBuilder } from '@mikro-orm/postgresql';
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
import { Err, Ok } from '../../../shared/util/result.js';

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

    /**
     * WARNING: Requires manual checks for consistency!
     * @param rollenerweiterung
     * @returns
     */
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

    public async findManyByOrganisationId(
        organisationId: OrganisationID,
        offset?: number,
        limit?: number,
    ): Promise<Array<Rollenerweiterung<true>>> {
        const rollenerweiterungEntities: Loaded<RollenerweiterungEntity>[] = await this.em.find(
            RollenerweiterungEntity,
            {
                organisationId,
            },
            {
                offset,
                limit,
            },
        );
        return rollenerweiterungEntities.map((entity: Loaded<RollenerweiterungEntity>) =>
            this.mapEntityToAggregate(entity),
        );
    }

    public async findManyByOrganisationIdAndServiceProviderId(
        organisationId: OrganisationID,
        serviceProviderId: ServiceProviderID,
    ): Promise<Array<Rollenerweiterung<true>>> {
        const rollenerweiterungEntities: Loaded<RollenerweiterungEntity>[] = await this.em.find(
            RollenerweiterungEntity,
            {
                organisationId,
                serviceProviderId,
            },
        );
        return rollenerweiterungEntities.map((entity: Loaded<RollenerweiterungEntity>) =>
            this.mapEntityToAggregate(entity),
        );
    }

    public async deleteByComposedId(props: {
        organisationId: OrganisationID;
        rolleId: RolleID;
        serviceProviderId: ServiceProviderID;
    }): Promise<Result<null, DomainError>> {
        if (!(await this.exists(props))) {
            return Err(new EntityNotFoundError(`Rollenerweiterung ${JSON.stringify(props)}`));
        }

        await this.em.nativeDelete(RollenerweiterungEntity, {
            serviceProviderId: props.serviceProviderId,
            organisationId: props.organisationId,
            rolleId: props.rolleId,
        });
        return Ok(null);
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
        organisationIds?: string[],
        offset?: number,
        limit?: number,
    ): Promise<Counted<Rollenerweiterung<true>>> {
        // Get paginated unique organisation IDs using QueryBuilder
        const qb: QueryBuilder<RollenerweiterungEntity> = this.em.createQueryBuilder(RollenerweiterungEntity, 're');
        qb.select(['re.organisation_id', 'o.kennung'])
            .distinct()
            .innerJoin('re.organisationId', 'o')
            .where({ serviceProviderId })
            .orderBy({ 'o.kennung': 'ASC' })
            .limit(limit ?? 999999)
            .offset(offset ?? 0);

        if (organisationIds && organisationIds.length > 0) {
            qb.andWhere({ organisationId: { $in: organisationIds } });
        }

        const pagedOrgIdsResult: Array<{ organisationId: string; kennung: string }> = await qb.execute();
        const pagedOrgIds: string[] = pagedOrgIdsResult.map((row: { organisationId: string }) => row.organisationId);

        // Count total unique organisations
        const countQb: QueryBuilder<RollenerweiterungEntity> = this.em.createQueryBuilder(
            RollenerweiterungEntity,
            're',
        );
        countQb
            .count('re.organisationId', true) // true for DISTINCT
            .where({ serviceProviderId });

        if (organisationIds && organisationIds.length > 0) {
            countQb.andWhere({ organisationId: { $in: organisationIds } });
        }

        const countResult: { count: string | number } = await countQb.execute('get', true);
        const totalUniqueOrgs: number = Number(countResult.count);

        // If no organisations found, return empty result
        if (pagedOrgIds.length === 0) {
            return [[], totalUniqueOrgs];
        }

        // Get all rollenerweiterungen for the paginated organisations
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

        return [rollenerweiterungen, Number(totalUniqueOrgs)];
    }
}
