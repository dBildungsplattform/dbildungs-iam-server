import { EntityManager, Loaded, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { OrganisationID, RolleID, ServiceProviderID } from '../../../shared/types/aggregate-ids.types.js';
import { PermittedOrgas, PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { RollenSystemRecht } from '../domain/systemrecht.js';
import { RollenerweiterungFactory } from '../domain/rollenerweiterung.factory.js';
import { Rollenerweiterung } from '../domain/rollenerweiterung.js';
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

    public async createAuthorized(
        rollenerweiterung: Rollenerweiterung<false>,
        permissions: PersonPermissions,
    ): Promise<Result<Rollenerweiterung<true>, DomainError>> {
        const permissionError: Option<MissingPermissionsError> = await this.checkPermissions(
            permissions,
            rollenerweiterung.organisationId,
        );
        if (permissionError) {return { ok: false, error: permissionError };}

        const referenceError: Option<EntityNotFoundError> = await rollenerweiterung.checkReferences();
        if (referenceError) {return { ok: false, error: referenceError };}

        const noRedundantRollenerweiterung: NoRedundantRollenerweiterung = new NoRedundantRollenerweiterung();
        if (!(await noRedundantRollenerweiterung.isSatisfiedBy(rollenerweiterung))) {
            return { ok: false, error: new NoRedundantRollenerweiterungError() };
        }

        const serviceProviderVerfuegbarFuerRollenerweiterung: ServiceProviderVerfuegbarFuerRollenerweiterung =
            new ServiceProviderVerfuegbarFuerRollenerweiterung();
        const result: boolean = await serviceProviderVerfuegbarFuerRollenerweiterung.isSatisfiedBy(rollenerweiterung);
        if (!result) {return { ok: false, error: new ServiceProviderNichtVerfuegbarFuerRollenerweiterungError() };}

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
        if (query.length === 0) {return [];}
        const rollenerweiterungen: Loaded<RollenerweiterungEntity>[] = await this.em.find(RollenerweiterungEntity, {
            $or: query,
        });
        return rollenerweiterungen.map((entity: Loaded<RollenerweiterungEntity>) => this.mapEntityToAggregate(entity));
    }
}
