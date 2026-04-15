import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Response } from 'express';

import { DuplicateNameError } from '../specification/error/duplicate-name.error.js';
import { ServiceProviderError } from '../specification/error/service-provider.error.js';
import { DbiamServiceProviderError, ServiceProviderErrorI18nTypes } from './dbiam-service-provider.error.js';
import { AttachedRollenError } from '../domain/errors/attached-rollen.error.js';
import { AttachedRollenerweiterungenError } from '../domain/errors/attached-rollenerweiterungen.error.js';

@Catch(ServiceProviderError)
export class ServiceProviderErrorFilter implements ExceptionFilter<ServiceProviderError> {
    private ERROR_MAPPINGS: Map<string, DbiamServiceProviderError> = new Map([
        [
            DuplicateNameError.name,
            new DbiamServiceProviderError({
                code: 400,
                i18nKey: ServiceProviderErrorI18nTypes.DUPLICATE_NAME,
            }),
        ],
        [
            AttachedRollenError.name,
            new DbiamServiceProviderError({
                code: 409,
                i18nKey: ServiceProviderErrorI18nTypes.ATTACHED_ROLLEN,
            }),
        ],
        [
            AttachedRollenerweiterungenError.name,
            new DbiamServiceProviderError({
                code: 409,
                i18nKey: ServiceProviderErrorI18nTypes.ATTACHED_ROLLENERWEITERUNGEN,
            }),
        ],
    ]);

    public catch(exception: ServiceProviderError, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();

        const dbiamServiceProviderError: DbiamServiceProviderError = this.mapDomainErrorToDbiamError(exception);

        response.status(dbiamServiceProviderError.code);
        response.json(dbiamServiceProviderError);
    }

    private mapDomainErrorToDbiamError(error: ServiceProviderError): DbiamServiceProviderError {
        return (
            this.ERROR_MAPPINGS.get(error.constructor.name) ??
            new DbiamServiceProviderError({
                code: 500,
                i18nKey: ServiceProviderErrorI18nTypes.SERVICE_PROVIDER_ERROR,
            })
        );
    }
}
