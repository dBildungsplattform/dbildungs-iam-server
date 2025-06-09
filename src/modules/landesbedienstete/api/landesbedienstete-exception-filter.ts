import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';
import { DomainError } from '../../../shared/error/domain.error.js';
import { LandesbediensteteError, LandesbediensteteErrorI18nTypes } from './landesbedienstete.error.js';
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { PersonenkontexteUpdateError } from '../../personenkontext/domain/error/personenkontexte-update.error.js';

@Catch(DomainError)
export class LandesbediensteteExceptionFilter implements ExceptionFilter<DomainError> {
    private readonly ERROR_MAPPINGS: Map<string, LandesbediensteteError> = new Map([
        [
            MissingPermissionsError.name,
            new LandesbediensteteError({
                code: 403,
                i18nKey: LandesbediensteteErrorI18nTypes.MISSING_PERMISSIONS,
            }),
        ],
        [
            EntityNotFoundError.name,
            new LandesbediensteteError({
                code: 404,
                i18nKey: LandesbediensteteErrorI18nTypes.NOT_FOUND,
            }),
        ],
        [
            PersonenkontexteUpdateError.name,
            new LandesbediensteteError({
                code: 400,
                i18nKey: LandesbediensteteErrorI18nTypes.UPDATE_ERROR,
            }),
        ],
    ]);

    public catch(exception: DomainError, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();

        const landesbediensteteError: LandesbediensteteError = this.mapDomainErrorToDbiamError(exception);

        response.status(landesbediensteteError.code);
        response.json(landesbediensteteError);
    }

    private mapDomainErrorToDbiamError(error: DomainError): LandesbediensteteError {
        return (
            this.ERROR_MAPPINGS.get(error.constructor.name) ??
            new LandesbediensteteError({
                code: 500,
                i18nKey: LandesbediensteteErrorI18nTypes.LANDESBEDIENSTETE_ERROR,
            })
        );
    }
}
