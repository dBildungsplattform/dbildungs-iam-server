import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { PersonenkontextEntity } from '../../personenkontext/persistence/personenkontext.entity.js';
import { PersonRepository } from './person.repository.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { PersonID } from '../../../shared/types/index.js';

function mapEntityToAggregate(
    entity: PersonenkontextEntity,
    personRepository: PersonRepository,
    organisationRepository: OrganisationRepository,
    rolleRepo: RolleRepo,
): Personenkontext<boolean> {
    return Personenkontext.construct(
        personRepository,
        organisationRepository,
        rolleRepo,
        entity.id,
        entity.createdAt,
        entity.updatedAt,
        entity.personId.id,
        entity.organisationId,
        entity.rolleId.id,
        entity.referrer,
        entity.mandant,
        entity.personenstatus,
        entity.jahrgangsstufe,
        entity.sichtfreigabe,
        entity.loeschungZeitpunkt,
        entity.revision,
    );
}

@Injectable()
export class DBiamPersonenkontextHelperRepo {
    public constructor(
        private readonly em: EntityManager,
        private readonly organisationRepository: OrganisationRepository,
        private readonly rolleRepo: RolleRepo,
    ) {}

    public async findByPersonID(
        personRepository: PersonRepository,
        personId: PersonID,
    ): Promise<Personenkontext<true>[]> {
        const personenKontexte: PersonenkontextEntity[] = await this.em.find(PersonenkontextEntity, {
            personId,
        });

        return personenKontexte.map((pk: PersonenkontextEntity) =>
            mapEntityToAggregate(pk, personRepository, this.organisationRepository, this.rolleRepo),
        );
    }
}
