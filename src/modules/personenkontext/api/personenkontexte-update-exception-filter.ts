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

@Catch(PersonenkontexteUpdateError)
export class PersonenkontexteUpdateExceptionFilter implements ExceptionFilter<PersonenkontexteUpdateError> {
    private ERROR_MAPPINGS: Map<string, DbiamPersonenkontextError> = new Map([
        [
            UpdateCountError.name,
            new DbiamPersonenkontexteUpdateError({
                code: 400,
                i18nKey: PersonenkontexteUpdateErrorI18nTypes.COUNT_MISMATCHING_ERROR,
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
            UpdatePersonIdMismatchError.name,
            new DbiamPersonenkontexteUpdateError({
                code: 400,
                i18nKey: PersonenkontexteUpdateErrorI18nTypes.PERSON_ID_MISMATCH_ERROR,
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
