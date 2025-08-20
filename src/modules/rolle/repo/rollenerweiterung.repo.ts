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
        const permissionError: Option<DomainError> = await this.checkPermissions(permissions, rollenerweiterung.organisationId);
        if (permissionError) return { ok: false, error: permissionError };

        const referenceError: Option<DomainError> = await rollenerweiterung.checkReferences();
        if (referenceError) return { ok: false, error: referenceError };

        // TODO: check if SP is available for extension

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

    private async checkPermissions(permissions: PersonPermissions, organisationId: OrganisationID): Promise<Option<DomainError>> {
        const permittedOrgas: PermittedOrgas = await permissions.getOrgIdsWithSystemrecht([RollenSystemRecht.ROLLEN_ERWEITERN], true);
        if (permittedOrgas.all || permittedOrgas.orgaIds.includes(organisationId)) {
            return undefined;
        }
        return new MissingPermissionsError(`Missing systemrecht ${RollenSystemRecht.ROLLEN_ERWEITERN}.`);
    }
}
