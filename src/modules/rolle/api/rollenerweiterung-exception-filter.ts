import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { DbiamRolleError } from './dbiam-rolle.error.js';
import { RollenerweiterungDomainError } from '../domain/rollenerweiterung-domain.error.js';
import { MissingMerkmalVerfuegbarFuerRollenerweiterungError } from '../domain/missing-merkmal-verfuegbar-fuer-rollenerweiterung.error.js';
import { DbiamRollenerweiterungError, RollenerweiterungErrorI18nTypes } from './dbiam-rollenerweiterung.error.js';

@Catch(RollenerweiterungDomainError)
export class RollenerweiterungExceptionFilter implements ExceptionFilter<RollenerweiterungDomainError> {
    private ERROR_MAPPINGS: Map<string, DbiamRollenerweiterungError> = new Map([
        [
            MissingMerkmalVerfuegbarFuerRollenerweiterungError.name,
            new DbiamRollenerweiterungError({
                code: 400,
                i18nKey: RollenerweiterungErrorI18nTypes.MISSING_MERKMAL_VERFUEGBAR_FUER_ROLLENERWEITERUNG_ERROR,
            }),
        ],
    ]);

    public catch(exception: RollenerweiterungDomainError, host: ArgumentsHost): void {
        const ctx: ReturnType<ArgumentsHost['switchToHttp']> = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();

        const dbiamRolleError: DbiamRolleError = this.mapDomainErrorToDbiamError(exception);

        response.status(dbiamRolleError.code);
        response.json(dbiamRolleError);
    }

    private mapDomainErrorToDbiamError(error: RollenerweiterungDomainError): DbiamRolleError {
        return (
            this.ERROR_MAPPINGS.get(error.constructor.name) ??
            new DbiamRollenerweiterungError({
                code: 500,
                i18nKey: RollenerweiterungErrorI18nTypes.ROLLENERWEITERUNG_ERROR,
            })
        );
    }
}
