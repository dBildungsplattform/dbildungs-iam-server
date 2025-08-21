import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { RollenerweiterungFactory } from '../domain/rollenerweiterung.factory.js';
import { Rollenerweiterung } from '../domain/rollenerweiterung.js';
import { RollenerweiterungEntity } from '../entity/rollenerweiterung.entity.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { PermittedOrgas, PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';
import { RollenSystemRecht } from '../domain/rolle.enums.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { ServiceProviderNichtVerfuegbarFuerRollenerweiterungError } from '../specification/error/service-provider-nicht-verfuegbar-fuer-rollenerweiterung.error.js';
import { ServiceProviderVerfuegbarFuerRollenerweiterung } from '../specification/service-provider-verfuegbar-fuer-rollenerweiterung.specification.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';

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

    public async createAuthorized(
        rollenerweiterung: Rollenerweiterung<false>,
        permissions: PersonPermissions,
    ): Promise<Result<Rollenerweiterung<true>, DomainError>> {
        const permissionError: Option<MissingPermissionsError> = await this.checkPermissions(
            permissions,
            rollenerweiterung.organisationId,
        );
        if (permissionError) return { ok: false, error: permissionError };

        const referenceError: Option<EntityNotFoundError> = await rollenerweiterung.checkReferences();
        if (referenceError) return { ok: false, error: referenceError };

        const serviceProviderVerfuegbarFuerRollenerweiterungSpecification: ServiceProviderVerfuegbarFuerRollenerweiterung =
            new ServiceProviderVerfuegbarFuerRollenerweiterung();
        const result: boolean =
            await serviceProviderVerfuegbarFuerRollenerweiterungSpecification.isSatisfiedBy(rollenerweiterung);
        if (!result) return { ok: false, error: new ServiceProviderNichtVerfuegbarFuerRollenerweiterungError() };

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
        return new MissingPermissionsError(`Missing systemrecht ${RollenSystemRecht.ROLLEN_ERWEITERN}.`);
    }
}
