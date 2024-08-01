import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';
import { PersonDomainError } from '../domain/person-domain.error.js';
import { VornameForPersonWithTrailingSpaceError } from '../domain/vorname-with-trailing-space.error.js';
import { FamiliennameForPersonWithTrailingSpaceError } from '../domain/familienname-with-trailing-space.error.js';
import { DbiamPersonError, PersonErrorI18nTypes } from './dbiam-person.error.js';

@Catch(PersonDomainError)
export class PersonExceptionFilter implements ExceptionFilter<PersonDomainError> {
    private ERROR_MAPPINGS: Map<string, DbiamPersonError> = new Map([
        [
            FamiliennameForPersonWithTrailingSpaceError.name,
            new DbiamPersonError({
                code: 400,
                i18nKey: PersonErrorI18nTypes.FAMILIENNAME_ENTHAELT_LEERZEICHEN,
            }),
        ],
        [
            VornameForPersonWithTrailingSpaceError.name,
            new DbiamPersonError({
                code: 400,
                i18nKey: PersonErrorI18nTypes.VORNAME_ENTHAELT_LEERZEICHEN,
            }),
        ],
    ]);

    public catch(exception: PersonDomainError, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();

        const dbiamPersonError: DbiamPersonError = this.mapDomainErrorToDbiamError(exception);

        response.status(dbiamPersonError.code);
        response.json(dbiamPersonError);
    }

    private mapDomainErrorToDbiamError(error: PersonDomainError): DbiamPersonError {
        return (
            this.ERROR_MAPPINGS.get(error.constructor.name) ??
            new DbiamPersonError({
                code: 500,
                i18nKey: PersonErrorI18nTypes.PERSON_ERROR,
            })
        );
    }
}
