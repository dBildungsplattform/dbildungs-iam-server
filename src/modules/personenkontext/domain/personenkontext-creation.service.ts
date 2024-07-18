import { Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/error/index.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Personenkontext } from './personenkontext.js';
import { PersonenkontextWorkflowFactory } from './personenkontext-workflow.factory.js';
import { PersonenkontextWorkflowAggregate } from './personenkontext-workflow.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { PersonFactory } from '../../person/domain/person.factory.js';
import { DbiamPersonenkontextFactory } from './dbiam-personenkontext.factory.js';
import { PersonenkontexteUpdateError } from './error/personenkontexte-update.error.js';
import { PersonenkontexteUpdate } from './personenkontexte-update.js';

export type PersonPersonenkontext = {
    person: Person<true>;
    personenkontext: Personenkontext<true>;
};

@Injectable()
export class PersonenkontextCreationService {
    public constructor(
        private readonly personRepository: PersonRepository,
        private readonly personFactory: PersonFactory,
        private readonly personenkontextWorkflowFactory: PersonenkontextWorkflowFactory,
        private readonly dbiamPersonenkontextFactory: DbiamPersonenkontextFactory,
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

        const pkUpdate: PersonenkontexteUpdate = this.dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(
            savedPerson.id,
            new Date(),
            0,
            [
                {
                    personId: savedPerson.id,
                    organisationId,
                    rolleId,
                },
            ],
            // Permissions were checked in PersonenkontextWorkflowAggregate
            PersonPermissions.ALL,
        );

        const updateResult: Personenkontext<true>[] | PersonenkontexteUpdateError = await pkUpdate.update();
        if (updateResult instanceof DomainError) {
            return updateResult;
        }

        if (updateResult.length !== 1) {
            return new PersonenkontexteUpdateError('The number of updated personenkontexte is invalid');
        }

        return {
            person: savedPerson,
            personenkontext: updateResult[0]!,
        };
    }
}
