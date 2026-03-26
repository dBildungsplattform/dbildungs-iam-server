import { Injectable } from '@nestjs/common';
import { DomainError } from '../../../shared/error/index.js';
import { Personenkontext } from './personenkontext.js';
import { PersonenkontextWorkflowFactory } from './personenkontext-workflow.factory.js';
import { PersonenkontextWorkflowAggregate } from './personenkontext-workflow.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { PersonFactory } from '../../person/domain/person.factory.js';
import { DbiamPersonenkontextFactory } from './dbiam-personenkontext.factory.js';
import { PersonenkontexteUpdateError } from './error/personenkontexte-update.error.js';
import { PersonenkontexteUpdate } from './personenkontexte-update.js';
import { DbiamCreatePersonenkontextBodyParams } from '../api/param/dbiam-create-personenkontext.body.params.js';
import { OperationContext } from './personenkontext.enums.js';
import {
    EscalatedPermissionAtOrga,
    isEscalatedPersonPermissions,
} from '../../authentication/domain/escalated-person-permissions.js';
import { EscalatedPersonPermissionsFactory } from '../../authentication/domain/escalated-person-permissions.factory.js';
import { isPersonPermissions } from '../../authentication/domain/person-permissions.js';
import { RollenSystemRechtEnum } from '../../rolle/domain/systemrecht.js';
import { IPersonPermissions } from '../../../shared/permissions/person-permissions.interface.js';

export type PersonPersonenkontext = {
    person: Person<true>;
    personenkontexte: Personenkontext<true>[];
};

@Injectable()
export class PersonenkontextCreationService {
    public constructor(
        private readonly personRepository: PersonRepository,
        private readonly personFactory: PersonFactory,
        private readonly personenkontextWorkflowFactory: PersonenkontextWorkflowFactory,
        private readonly dbiamPersonenkontextFactory: DbiamPersonenkontextFactory,
        private readonly escalatedPersonPermissionsFactory: EscalatedPersonPermissionsFactory,
    ) {}

    public async createPersonWithPersonenkontexte(
        permissions: IPersonPermissions,
        vorname: string,
        familienname: string,
        createPersonenkontexte: DbiamCreatePersonenkontextBodyParams[],
        personalnummer?: string,
        befristung?: Date,
    ): Promise<PersonPersonenkontext | DomainError> {
        const person: Person<false> | DomainError = await this.personFactory.createNew({
            vorname: vorname,
            familienname: familienname,
            personalnummer: personalnummer,
        });
        if (person instanceof DomainError) {
            return person;
        }

        const anlage: PersonenkontextWorkflowAggregate = this.personenkontextWorkflowFactory.createNew();
        /* eslint-disable no-await-in-loop */
        for (const createPersonenkontext of createPersonenkontexte) {
            // No person ID
            anlage.initialize(undefined, createPersonenkontext.organisationId, [createPersonenkontext.rolleId]);
            const canCommit: DomainError | boolean = await anlage.canCommit(
                permissions,
                OperationContext.PERSON_ANLEGEN,
            );
            if (canCommit instanceof DomainError) {
                return canCommit;
            }
        }

        //Save Person
        const savedPerson: DomainError | Person<true> = await this.personRepository.create(person);

        if (savedPerson instanceof DomainError) {
            return savedPerson;
        }

        let permissionsToUse: IPersonPermissions;
        if (isEscalatedPersonPermissions(permissions)) {
            permissionsToUse = permissions;
        } else if (isPersonPermissions(permissions)) {
            permissionsToUse = await this.escalatedPersonPermissionsFactory.fromPersonPermissions(
                permissions,
                createPersonenkontexte.map(
                    (createPersonenkontext: DbiamCreatePersonenkontextBodyParams) =>
                        ({
                            orgaId: createPersonenkontext.organisationId,
                            systemrechte: [RollenSystemRechtEnum.PERSONEN_VERWALTEN],
                        }) satisfies EscalatedPermissionAtOrga,
                ),
            );
        } else {
            throw new Error('TBD');
        }

        const pkUpdate: PersonenkontexteUpdate = this.dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(
            savedPerson.id,
            new Date(),
            0,
            createPersonenkontexte.map((createPersonenkontext: DbiamCreatePersonenkontextBodyParams) => ({
                personId: savedPerson.id,
                organisationId: createPersonenkontext.organisationId,
                rolleId: createPersonenkontext.rolleId,
                befristung,
            })),
            permissionsToUse,
        );

        const updateResult: Personenkontext<true>[] | PersonenkontexteUpdateError = await pkUpdate.update();
        if (updateResult instanceof DomainError) {
            return updateResult;
        }

        if (updateResult.length !== createPersonenkontexte.length) {
            return new PersonenkontexteUpdateError('The number of updated personenkontexte is invalid');
        }

        return {
            person: savedPerson,
            personenkontexte: updateResult,
        };
    }
}
