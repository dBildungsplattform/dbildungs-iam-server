import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';
import { AddSystemrechtError } from './add-systemrecht.error.js';
import { DbiamRolleError, RolleErrorI18nTypes } from './dbiam-rolle.error.js';
import { UpdateMerkmaleError } from '../domain/update-merkmale.error.js';
import { RolleDomainError } from '../domain/rolle-domain.error.js';

@Catch(RolleDomainError)
export class RolleExceptionFilter implements ExceptionFilter<RolleDomainError> {
    private ERROR_MAPPINGS: Map<string, DbiamRolleError> = new Map([
        [
            AddSystemrechtError.name,
            new DbiamRolleError({
                code: 500,
                i18nKey: RolleErrorI18nTypes.ADD_SYSTEMRECHT_ERROR,
            }),
        ],
        [
            UpdateMerkmaleError.name,
            new DbiamRolleError({
                code: 400,
                i18nKey: RolleErrorI18nTypes.UPDATE_MERKMALE_ERROR,
            }),
        ],
    ]);

    public catch(exception: RolleDomainError, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();

        const dbiamRolleError: DbiamRolleError = this.mapDomainErrorToDbiamError(exception);

        response.status(dbiamRolleError.code);
        response.json(dbiamRolleError);
    }

    private mapDomainErrorToDbiamError(error: RolleDomainError): DbiamRolleError {
        return (
            this.ERROR_MAPPINGS.get(error.constructor.name) ??
            new DbiamRolleError({
                code: 500,
                i18nKey: RolleErrorI18nTypes.ROLLE_ERROR,
            })
        );
    }
}
