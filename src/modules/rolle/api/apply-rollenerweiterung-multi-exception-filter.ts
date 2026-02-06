import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';
import { DbiamRolleError } from './dbiam-rolle.error.js';
import { ApplyRollenerweiterungRolesError } from './apply-rollenerweiterung-roles.error.js';
import {
    DbiamApplyRollenerweiterungMultiError,
    DbiamApplyRollenerweiterungMultiErrorI18NTypes,
} from './dbiam-apply-rollenerweiterung-multi.error.js';
import { DomainError, EntityNotFoundError } from '../../../shared/error/index.js';
import { NoRedundantRollenerweiterungError } from '../specification/error/no-redundant-rollenerweiterung.error.js';

@Catch(ApplyRollenerweiterungRolesError)
export class ApplyRollenerweiterungMultiExceptionFilter implements ExceptionFilter<ApplyRollenerweiterungRolesError> {
    private ERROR_I18NMAPPING: Map<string, DbiamApplyRollenerweiterungMultiErrorI18NTypes> = new Map([
        [EntityNotFoundError.name, DbiamApplyRollenerweiterungMultiErrorI18NTypes.NOT_FOUND],
        [
            NoRedundantRollenerweiterungError.name,
            DbiamApplyRollenerweiterungMultiErrorI18NTypes.NO_REDUNDANT_ROLLENERWEITERUNG,
        ],
    ]);

    public catch(exception: ApplyRollenerweiterungRolesError, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();

        const dbiamRolleError: DbiamRolleError | DbiamApplyRollenerweiterungMultiError =
            this.mapDomainErrorToDbiamError(exception);

        response.status(dbiamRolleError.code);
        response.json(dbiamRolleError);
    }

    private mapDomainErrorToDbiamError(
        error: ApplyRollenerweiterungRolesError,
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
