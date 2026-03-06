import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';
import { SharedDomainError } from '../error/shared-domain.error.js';
import { DbiamSharedError, SharedErrorI18nTypes } from '../error/dbiam-shared.error.js';

@Catch(SharedDomainError)
export class SharedExceptionFilter implements ExceptionFilter<SharedDomainError> {
    public catch(exception: SharedDomainError, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();
        const i18nKey: SharedErrorI18nTypes = this.toI18nKey(exception.code);
        const status: number = this.mapDomainErrorToHttpCode(i18nKey);

        const dbiamSharedError: DbiamSharedError = new DbiamSharedError({
            code: status,
            i18nKey: i18nKey,
        });

        response.status(status);
        response.json(dbiamSharedError);
    }

    private toI18nKey(code: string): SharedErrorI18nTypes {
        if (Object.values(SharedErrorI18nTypes).includes(code as SharedErrorI18nTypes)) {
            return code as SharedErrorI18nTypes;
        }
        return SharedErrorI18nTypes.INTERNAL;
    }

    private mapDomainErrorToHttpCode(code: SharedErrorI18nTypes): number {
        switch (code) {
            case SharedErrorI18nTypes.NOT_FOUND:
                return 404;
            case SharedErrorI18nTypes.ALREADY_EXISTS:
                return 409;
            case SharedErrorI18nTypes.CONFLICT:
                return 409;
            case SharedErrorI18nTypes.LIMIT_EXCEEDED:
                return 400;
            default:
                return 500;
        }
    }
}
