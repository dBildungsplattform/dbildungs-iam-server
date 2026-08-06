import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { DbiamRolleError } from './dbiam-rolle.error.js';
import { ApplyRollenerweiterungError } from './apply-rollenerweiterung.error.js';
import {
    DbiamApplyRollenerweiterungMultiError,
    DbiamApplyRollenerweiterungMultiErrorI18NTypes,
} from './dbiam-apply-rollenerweiterung-multi.error.js';
import { DomainError, EntityNotFoundError } from '../../../shared/error/index.js';
import { NoRedundantRollenerweiterungError } from '../specification/error/no-redundant-rollenerweiterung.error.js';

@Catch(ApplyRollenerweiterungError)
export class ApplyRollenerweiterungMultiExceptionFilter implements ExceptionFilter<ApplyRollenerweiterungError> {
    private ERROR_I18NMAPPING: Map<string, DbiamApplyRollenerweiterungMultiErrorI18NTypes> = new Map([
        [EntityNotFoundError.name, DbiamApplyRollenerweiterungMultiErrorI18NTypes.NOT_FOUND],
        [
            NoRedundantRollenerweiterungError.name,
            DbiamApplyRollenerweiterungMultiErrorI18NTypes.NO_REDUNDANT_ROLLENERWEITERUNG,
        ],
    ]);

    public catch(exception: ApplyRollenerweiterungError, host: ArgumentsHost): void {
        const ctx: ReturnType<ArgumentsHost['switchToHttp']> = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();

        const dbiamRolleError: DbiamRolleError | DbiamApplyRollenerweiterungMultiError =
            this.mapDomainErrorToDbiamError(exception);

        response.status(dbiamRolleError.code);
        response.json(dbiamRolleError);
    }

    private mapDomainErrorToDbiamError(
        error: ApplyRollenerweiterungError,
    ): DbiamRolleError | DbiamApplyRollenerweiterungMultiError {
        return new DbiamApplyRollenerweiterungMultiError({
            code: 400,
            rolleIdsWithI18nKeys: error.errors.map((e: { id: string | undefined; error: DomainError }) => ({
                rolleId: e.id!,
                i18nKey:
                    this.ERROR_I18NMAPPING.get(e.error.constructor.name) ||
                    DbiamApplyRollenerweiterungMultiErrorI18NTypes.ROLLENERWEITERUNG_TECHNICAL_ERROR,
            })),
        });
    }
}
