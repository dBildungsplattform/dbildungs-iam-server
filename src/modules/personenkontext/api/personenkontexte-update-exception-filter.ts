import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';
import { DbiamPersonenkontextError } from './dbiam-personenkontext.error.js';
import { UpdateCountError } from '../domain/error/update-count.error.js';
import { UpdateNotFoundError } from '../domain/error/update-not-found.error.js';
import { UpdateOutdatedError } from '../domain/error/update-outdated.error.js';
import { UpdatePersonIdMismatchError } from '../domain/error/update-person-id-mismatch.error.js';
import {
    DbiamPersonenkontexteUpdateError,
    PersonenkontexteUpdateErrorI18nTypes,
} from './dbiam-personenkontexte-update.error.js';
import { PersonenkontexteUpdateError } from '../domain/error/personenkontexte-update.error.js';
import { UpdateInvalidLastModifiedError } from '../domain/error/update-invalid-last-modified.error.js';
import { UpdatePersonNotFoundError } from '../domain/error/update-person-not-found.error.js';
import { UpdateInvalidRollenartForLernError } from '../domain/error/update-invalid-rollenart-for-lern.error.js';
import { PersonenkontextCommitError } from '../domain/error/personenkontext-commit.error.js';
import { PersonenkontextBefristungRequiredError } from '../domain/error/personenkontext-befristung-required.error.js';
import { DuplicateKlassenkontextError } from '../domain/error/update-invalid-duplicate-klassenkontext-for-same-rolle.js';
import { UpdateLernNotAtSchuleAndKlasseError } from '../domain/error/update-lern-not-at-schule-and-klasse.error.js';

@Catch(PersonenkontexteUpdateError)
export class PersonenkontexteUpdateExceptionFilter implements ExceptionFilter<PersonenkontexteUpdateError> {
    private ERROR_MAPPINGS: Map<string, DbiamPersonenkontextError> = new Map([
        [
            UpdateCountError.name,
            new DbiamPersonenkontexteUpdateError({
                code: 400,
                i18nKey: PersonenkontexteUpdateErrorI18nTypes.COUNT_MISMATCHING,
            }),
        ],
        [
            UpdateNotFoundError.name,
            new DbiamPersonenkontexteUpdateError({
                code: 400,
                i18nKey: PersonenkontexteUpdateErrorI18nTypes.PERSONENKONTEXT_NOT_FOUND,
            }),
        ],
        [
            UpdateOutdatedError.name,
            new DbiamPersonenkontexteUpdateError({
                code: 400,
                i18nKey: PersonenkontexteUpdateErrorI18nTypes.NEWER_VERSION_OF_PERSONENKONTEXTE_AVAILABLE,
            }),
        ],
        [
            UpdateInvalidLastModifiedError.name,
            new DbiamPersonenkontexteUpdateError({
                code: 400,
                i18nKey: PersonenkontexteUpdateErrorI18nTypes.INVALID_LAST_MODIFIED_VALUE,
            }),
        ],
        [
            UpdatePersonIdMismatchError.name,
            new DbiamPersonenkontexteUpdateError({
                code: 400,
                i18nKey: PersonenkontexteUpdateErrorI18nTypes.PERSON_ID_MISMATCH,
            }),
        ],
        [
            UpdatePersonNotFoundError.name,
            new DbiamPersonenkontexteUpdateError({
                code: 400,
                i18nKey: PersonenkontexteUpdateErrorI18nTypes.PERSON_NOT_FOUND,
            }),
        ],
        [
            UpdateInvalidRollenartForLernError.name,
            new DbiamPersonenkontexteUpdateError({
                code: 400,
                i18nKey: PersonenkontexteUpdateErrorI18nTypes.INVALID_PERSONENKONTEXT_FOR_PERSON_WITH_ROLLENART_LERN,
            }),
        ],
        [
            PersonenkontextCommitError.name,
            new DbiamPersonenkontexteUpdateError({
                code: 400,
                i18nKey: PersonenkontexteUpdateErrorI18nTypes.PERSONENKONTEXTE_UPDATE_ERROR,
            }),
        ],
        [
            PersonenkontextBefristungRequiredError.name,
            new DbiamPersonenkontexteUpdateError({
                code: 400,
                i18nKey: PersonenkontexteUpdateErrorI18nTypes.BEFRISTUNG_REQUIRED_FOR_PERSONENKONTEXT,
            }),
        ],
        [
            DuplicateKlassenkontextError.name,
            new DbiamPersonenkontexteUpdateError({
                code: 400,
                i18nKey: PersonenkontexteUpdateErrorI18nTypes.DUPLICATE_KLASSENKONTEXT_FOR_SAME_ROLLE,
            }),
        ],
        [
            UpdateLernNotAtSchuleAndKlasseError.name,
            new DbiamPersonenkontexteUpdateError({
                code: 400,
                i18nKey: PersonenkontexteUpdateErrorI18nTypes.LERN_NOT_AT_SCHULE_AND_KLASSE,
            }),
        ],
    ]);

    public catch(exception: PersonenkontexteUpdateError, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();
        const status: number = 400; //all errors regarding organisation specifications are BadRequests

        const dbiamRolleError: DbiamPersonenkontextError = this.mapDomainErrorToDbiamError(exception);

        response.status(status);
        response.json(dbiamRolleError);
    }

    private mapDomainErrorToDbiamError(error: PersonenkontexteUpdateError): DbiamPersonenkontexteUpdateError {
        return (
            this.ERROR_MAPPINGS.get(error.constructor.name) ??
            new DbiamPersonenkontexteUpdateError({
                code: 500,
                i18nKey: PersonenkontexteUpdateErrorI18nTypes.PERSONENKONTEXTE_UPDATE_ERROR,
            })
        );
    }
}
