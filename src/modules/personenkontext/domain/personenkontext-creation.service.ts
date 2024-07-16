import { Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/error/index.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { PersonenkontextFactory } from './personenkontext.factory.js';
import { Personenkontext } from './personenkontext.js';
import { PersonenkontextWorkflowFactory } from './personenkontext-workflow.factory.js';
import { PersonenkontextWorkflowAggregate } from './personenkontext-workflow.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { PersonFactory } from '../../person/domain/person.factory.js';

export type PersonPersonenkontext = {
    person: Person<true>;
    personenkontext: Personenkontext<true>;
};

@Injectable()
export class PersonenkontextCreationService {
    public constructor(
        private readonly personRepository: PersonRepository,
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly personFactory: PersonFactory,
        private readonly personenkontextFactory: PersonenkontextFactory,
        private readonly personenkontextWorkflowFactory: PersonenkontextWorkflowFactory,
    ) {}

    public async createPersonWithPersonenkontext(
        permissions: PersonPermissions,
        vorname: string,
        familienname: string,
        organisationId: string,
        rolleId: string,
    ): Promise<PersonPersonenkontext | DomainError> {
        const person: Person<false> | DomainError = await this.personFactory.createNew({
            vorname: vorname,
            familienname: familienname,
        });
        if (person instanceof DomainError) {
            return person;
        }
        const anlage: PersonenkontextWorkflowAggregate = this.personenkontextWorkflowFactory.createNew();

        anlage.initialize(organisationId, rolleId);

        // Check if permissions are enough to create the kontext
        const canCommit: DomainError | boolean = await anlage.canCommit(permissions);

        if (canCommit instanceof DomainError) {
            return canCommit;
        }
        //Save Person
        const savedPerson: DomainError | Person<true> = await this.personRepository.create(person);
        if (savedPerson instanceof DomainError) {
            return savedPerson;
        }

        const personenkontext: Personenkontext<false> = this.personenkontextFactory.createNew(
            savedPerson.id,
            organisationId,
            rolleId,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
        );
        //Save Personenkontext
        const savedPersonenkontext: Personenkontext<true> = await this.personenkontextRepo.save(personenkontext);
        return {
            person: savedPerson,
            personenkontext: savedPersonenkontext,
        };
    }
}
