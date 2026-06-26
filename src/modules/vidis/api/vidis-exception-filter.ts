import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

import { VidisError, VidisErrorI18nTypes } from './vidis.error.js';
import { VidisApiError } from '../error/vidis-api.error.js';
import { VidisDomainError } from '../error/vidis-domain.error.js';

@Catch(VidisDomainError)
export class VidisExceptionFilter implements ExceptionFilter<VidisDomainError> {
    private readonly ERROR_MAPPINGS: Map<string, VidisError> = new Map([
        [
            VidisApiError.name,
            new VidisError({
                code: 500,
                i18nKey: VidisErrorI18nTypes.VIDIS_API_ERROR,
            }),
        ],
    ]);

    public catch(exception: VidisDomainError, host: ArgumentsHost): void {
        const ctx: ReturnType<ArgumentsHost['switchToHttp']> = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();

        const vidisError: VidisError = this.mapDomainErrorToDbiamError(exception);

        response.status(vidisError.code);
        response.json(vidisError);
    }

    private mapDomainErrorToDbiamError(error: VidisDomainError): VidisError {
        return (
            this.ERROR_MAPPINGS.get(error.constructor.name) ??
            new VidisError({
                code: 500,
                i18nKey: VidisErrorI18nTypes.VIDIS_ERROR,
            })
        );
    }
}
