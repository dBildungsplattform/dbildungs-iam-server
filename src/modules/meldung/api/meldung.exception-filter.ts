import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';
import { MeldungDomainError } from '../domain/meldung-domain.error.js';
import { DbiamMeldungError, MeldungErrorI18nTypes } from './dbiam-meldung.error.js';
import { MeldungInhaltError } from '../domain/meldung-inhalt.error.js';

@Catch(MeldungDomainError)
export class MeldungExceptionFilter implements ExceptionFilter<MeldungDomainError> {
    private ERROR_MAPPINGS: Map<string, DbiamMeldungError> = new Map([
        [
            MeldungInhaltError.name,
            new DbiamMeldungError({
                code: 400,
                i18nKey: MeldungErrorI18nTypes.MELDUNG_INHALT,
            }),
        ],
    ]);

    public catch(exception: MeldungDomainError, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();

        const dbiamMeldungError: DbiamMeldungError = this.mapDomainErrorToDbiamError(exception);

        response.status(dbiamMeldungError.code);
        response.json(dbiamMeldungError);
    }

    private mapDomainErrorToDbiamError(error: MeldungDomainError): DbiamMeldungError {
        return (
            this.ERROR_MAPPINGS.get(error.constructor.name) ??
            new DbiamMeldungError({
                code: 500,
                i18nKey: MeldungErrorI18nTypes.MELDUNG_ERROR,
            })
        );
    }
}
