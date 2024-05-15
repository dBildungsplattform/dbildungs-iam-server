import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';
import { RolleApiError } from './rolle-api.error.js';
import { AddSystemrechtError } from './add-systemrecht.error.js';
import { DbiamRolleError, RolleErrorI18nTypes } from './dbiam-rolle.error.js';

@Catch(RolleApiError)
export class RolleExceptionFilter implements ExceptionFilter<RolleApiError> {
    private ERROR_MAPPINGS: Map<string, DbiamRolleError> = new Map([
        [
            AddSystemrechtError.name,
            new DbiamRolleError({
                code: 500,
                i18nKey: RolleErrorI18nTypes.ADD_SYSTEM_RECHT_ERROR,
            }),
        ],
    ]);

    public catch(exception: RolleApiError, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();
        const status: number = 500; //all errors regarding organisation specifications are InternalServerErrors at the moment

        const dbiamRolleError: DbiamRolleError = this.mapDomainErrorToDbiamError(exception);

        response.status(status);
        response.json(dbiamRolleError);
    }

    private mapDomainErrorToDbiamError(error: RolleApiError): DbiamRolleError {
        return (
            this.ERROR_MAPPINGS.get(error.constructor.name) ??
            new DbiamRolleError({
                code: 500,
                i18nKey: RolleErrorI18nTypes.ROLLE_ERROR,
            })
        );
    }
}
