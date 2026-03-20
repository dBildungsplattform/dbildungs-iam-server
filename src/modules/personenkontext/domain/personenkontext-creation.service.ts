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
import { PermissionsOverride } from '../../../shared/permissions/permissions-override.js';
import { DbiamCreatePersonenkontextBodyParams } from '../api/param/dbiam-create-personenkontext.body.params.js';
import { OperationContext } from './personenkontext.enums.js';

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
    ) {}

    public async createPersonWithPersonenkontexte(
        permissions: PersonPermissions,
        vorname: string,
        familienname: string,
        createPersonenkontexte: DbiamCreatePersonenkontextBodyParams[],
        personalnummer?: string,
        befristung?: Date,
    ): Promise<Result<PersonPersonenkontext, DomainError>> {
        const personOrError: Person<false> | DomainError = await this.personFactory.createNew({
            vorname: vorname,
            familienname: familienname,
            personalnummer: personalnummer,
        });
        if (personOrError instanceof DomainError) {
            return {
                ok: false,
                error: personOrError,
            };
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
                return {
                    ok: false,
                    error: canCommit,
                };
            }
        }

        //Save Person
        const savedPersonOrError: DomainError | Person<true> = await this.personRepository.create(personOrError);

        if (savedPersonOrError instanceof DomainError) {
            return {
                ok: false,
                error: savedPersonOrError,
            };
        }

        const pkUpdate: PersonenkontexteUpdate = this.dbiamPersonenkontextFactory.createNewPersonenkontexteUpdate(
            savedPersonOrError.id,
            new Date(),
            0,
            createPersonenkontexte.map((createPersonenkontext: DbiamCreatePersonenkontextBodyParams) => ({
                personId: savedPersonOrError.id,
                organisationId: createPersonenkontext.organisationId,
                rolleId: createPersonenkontext.rolleId,
                befristung,
            })),
            new PermissionsOverride(permissions).grantPersonModifyPermission(savedPersonOrError.id),
        );

        const updateResult: Personenkontext<true>[] | PersonenkontexteUpdateError = await pkUpdate.update();
        if (updateResult instanceof DomainError) {
            return {
                ok: false,
                error: updateResult,
            };
        }

        if (updateResult.length !== createPersonenkontexte.length) {
            return {
                ok: false,
                error: new PersonenkontexteUpdateError('The number of updated personenkontexte is invalid'),
            };
        }

        return {
            ok: true,
            value: {
                person: savedPersonOrError,
                personenkontexte: updateResult,
            },
        };
    }
}
