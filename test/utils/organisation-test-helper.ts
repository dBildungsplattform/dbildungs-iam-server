import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { OrganisationsTyp } from '../../src/modules/organisation/domain/organisation.enums.js';
import { OrganisationRepository } from '../../src/modules/organisation/persistence/organisation.repository.js';
import { OrganisationID } from '../../src/shared/types/index.js';
import { OrganisationEntity } from '../../src/modules/organisation/persistence/organisation.entity.js';

export async function createOrganisation(
    em: EntityManager,
    organisationRepository: OrganisationRepository,
    parentOrga: OrganisationID | undefined,
    isRoot: boolean,
    typ: OrganisationsTyp,
): Promise<OrganisationID> {
    const organisationData: RequiredEntityData<OrganisationEntity> = {
        id: isRoot ? organisationRepository.ROOT_ORGANISATION_ID : undefined,
        administriertVon: parentOrga,
        zugehoerigZu: parentOrga,
        typ,
    };

    const organisationEntity: OrganisationEntity = em.create(OrganisationEntity, organisationData);
    await em.persistAndFlush(organisationEntity);

    return organisationData.id!;
}

export function organisationCreatorFactory(em: EntityManager, organisationRepository: OrganisationRepository) {
    return async (
        parentOrga: OrganisationID | undefined,
        isRoot: boolean,
        typ: OrganisationsTyp,
    ): Promise<OrganisationID> => createOrganisation(em, organisationRepository, parentOrga, isRoot, typ);
}
