import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';
import { DomainError } from '../../../shared/error/domain.error.js';
import { LandesbediensteterError, LandesbediensteterErrorI18nTypes } from './landesbediensteter.error.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';

@Catch(MissingPermissionsError, EntityNotFoundError)
export class LandesbediensteterExceptionFilter implements ExceptionFilter<DomainError> {
    private readonly ERROR_MAPPINGS: Map<string, LandesbediensteterError> = new Map([
        [
            MissingPermissionsError.name,
            new LandesbediensteterError({
                code: 403,
                i18nKey: LandesbediensteterErrorI18nTypes.MISSING_PERMISSIONS,
            }),
        ],
        [
            EntityNotFoundError.name,
            new LandesbediensteterError({
                code: 404,
                i18nKey: LandesbediensteterErrorI18nTypes.NOT_FOUND,
            }),
        ],
    ]);

    public catch(exception: DomainError, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();

        const landesbediensteteError: LandesbediensteterError = this.mapDomainErrorToDbiamError(exception);

        response.status(landesbediensteteError.code);
        response.json(landesbediensteteError);
    }

    private mapDomainErrorToDbiamError(error: DomainError): LandesbediensteterError {
        return (
            this.ERROR_MAPPINGS.get(error.constructor.name) ??
            new LandesbediensteterError({
                code: 500,
                i18nKey: LandesbediensteterErrorI18nTypes.LANDESBEDIENSTETER_ERROR,
            })
        );
    }
}
