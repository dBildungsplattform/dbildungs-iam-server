import { Injectable } from '@nestjs/common';
import { RolleFactory } from '../../rolle/domain/rolle.factory.js';
import { RolleEntity } from '../../rolle/entity/rolle.entity.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { mapRolleEntityToAggregate as mapRepoRolleEntityToAggregate } from '../../rolle/repo/rolle.repo.js';
import { OrganisationEntity } from '../../organisation/persistence/organisation.entity.js';
import { mapOrgaEntityToAggregate as mapRepoOrgaEntityToAggregate } from '../../organisation/persistence/organisation.repository.js';
import { Organisation } from '../../organisation/domain/organisation.js';

/**
 * Utility mapper for converting entities of type B into their corresponding aggregate representations,
 * intended for use within repositories of type A.
 *
 * Example:
 * The DbiamPersonenkontextRepository (type A) may return a Personenkontext aggregate along with associated
 * Rolle (type B) and Organisation (type B) aggregates. This mapper facilitates the transformation of
 * RolleEntity and OrganisationEntity into their respective aggregates in this case, to maintain separation of concerns
 * and ensure consistency across domain boundaries.
 */


@Injectable()
export class EntityAggregateMapper {
    public constructor(protected readonly rolleFactory: RolleFactory) {}

    public mapRolleEntityToAggregate(rolleEntity: RolleEntity): Rolle<true> {
        return mapRepoRolleEntityToAggregate(rolleEntity, this.rolleFactory);
    }

    public mapOrganisationEntityToAggregate(orgaEntity: OrganisationEntity): Organisation<true> {
        return mapRepoOrgaEntityToAggregate(orgaEntity);
    }
}
