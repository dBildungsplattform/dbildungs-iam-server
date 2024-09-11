import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { OrganisationsTyp } from '../../src/modules/organisation/domain/organisation.enums.js';
import { OrganisationRepository } from '../../src/modules/organisation/persistence/organisation.repository.js';
import { OrganisationID } from '../../src/shared/types/index.js';
import { OrganisationEntity } from '../../src/modules/organisation/persistence/organisation.entity.js';

export async function createAndPersistRootOrganisationAndPersist(
    em: EntityManager,
    organisationRepository: OrganisationRepository,
): Promise<OrganisationEntity> {
    const organisationData: RequiredEntityData<OrganisationEntity> = {
        id: organisationRepository.ROOT_ORGANISATION_ID,
        typ: OrganisationsTyp.ROOT,
    };

    const organisationEntity: OrganisationEntity = em.create(OrganisationEntity, organisationData);
    await em.persistAndFlush(organisationEntity);

    return organisationEntity;
}

export async function createAndPersistOrganisation(
    em: EntityManager,
    parentOrga: OrganisationID | undefined,
    typ: OrganisationsTyp,
): Promise<OrganisationEntity> {
    const organisationData: RequiredEntityData<OrganisationEntity> = {
        administriertVon: parentOrga,
        zugehoerigZu: parentOrga,
        typ,
    };
    const organisationEntity: OrganisationEntity = em.create(OrganisationEntity, organisationData);
    await em.persistAndFlush(organisationEntity);

    return organisationEntity;
}
