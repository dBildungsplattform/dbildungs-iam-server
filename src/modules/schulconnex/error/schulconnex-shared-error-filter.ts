import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { NO_MAPPING_FOUND, SCHULCONNEX_ERROR_MAPPINGS } from '../../../shared/error/schul-connex-error.mapping.js';
import { DomainError } from '../../../shared/error/index.js';

@Catch(DomainError)
export class SchulConnexSharedErrorFilter implements ExceptionFilter<DomainError> {
    public catch(exception: DomainError, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();

        const schulConnexError: SchulConnexError = this.mapDomainErrorToSchulConnexError(exception);

        response.status(schulConnexError.code);
        response.json(schulConnexError);
    }

    private mapDomainErrorToSchulConnexError(error: DomainError): SchulConnexError {
        return SCHULCONNEX_ERROR_MAPPINGS.get(error.constructor.name) ?? NO_MAPPING_FOUND;
    }
}
