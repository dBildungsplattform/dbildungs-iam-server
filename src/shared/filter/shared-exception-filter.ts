import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces/index.js';
import { Response } from 'express';
import { SharedDomainError } from '../error/shared-domain.error.js';
import { DbiamSharedError, SharedErrorI18nTypes } from '../error/dbiam-shared.error.js';
import { EntityAlreadyExistsError } from '../error/entity-already-exists.error.js';
import { EntityCouldNotBeCreated } from '../error/entity-could-not-be-created.error.js';
import { EntityCouldNotBeDeleted } from '../error/entity-could-not-be-deleted.error.js';
import { EntityCouldNotBeUpdated } from '../error/entity-could-not-be-updated.error.js';
import { EntityNotFoundError } from '../error/entity-not-found.error.js';
import { ExceedsLimitError } from '../error/exceeds-limit.error.js';
import { InvalidAttributeLengthError } from '../error/invalid-attribute-length.error.js';
import { InvalidCharacterSetError } from '../error/invalid-character-set.error.js';
import { InvalidNameError } from '../error/invalid-name.error.js';
import { KeycloakClientError } from '../error/keycloak-client.error.js';
import { MismatchedRevisionError } from '../error/mismatched-revision.error.js';
import { MissingPermissionsError } from '../error/missing-permissions.error.js';
import { PersonAlreadyExistsError } from '../error/person-already-exists.error.js';
import { UserExternalDataWorkflowError } from '../error/user-externaldata-workflow.error.js';

@Catch(SharedDomainError)
export class SharedExceptionFilter implements ExceptionFilter<SharedDomainError> {
    private ERROR_MAPPINGS: Map<string, DbiamSharedError> = new Map([
        [
            EntityCouldNotBeCreated.name,
            new DbiamSharedError({
                code: 500,
                i18nKey: SharedErrorI18nTypes.ENTITY_COULD_NOT_BE_CREATED,
            }),
        ],
        [
            EntityCouldNotBeUpdated.name,
            new DbiamSharedError({
                code: 500,
                i18nKey: SharedErrorI18nTypes.ENTITY_COULD_NOT_BE_UPDATED,
            }),
        ],
        [
            EntityCouldNotBeDeleted.name,
            new DbiamSharedError({
                code: 500,
                i18nKey: SharedErrorI18nTypes.ENTITY_COULD_NOT_BE_DELETED,
            }),
        ],
        [
            EntityNotFoundError.name,
            new DbiamSharedError({
                code: 404,
                i18nKey: SharedErrorI18nTypes.ENTITY_NOT_FOUND,
            }),
        ],
        [
            KeycloakClientError.name,
            new DbiamSharedError({
                code: 500,
                i18nKey: SharedErrorI18nTypes.KEYCLOAK_CLIENT_ERROR,
            }),
        ],
        [
            MismatchedRevisionError.name,
            new DbiamSharedError({
                code: 409,
                i18nKey: SharedErrorI18nTypes.MISMATCHED_REVISION,
            }),
        ],
        [
            PersonAlreadyExistsError.name,
            new DbiamSharedError({
                code: 400,
                i18nKey: SharedErrorI18nTypes.PERSON_ALREADY_EXISTS,
            }),
        ],
        [
            EntityAlreadyExistsError.name,
            new DbiamSharedError({
                code: 400,
                i18nKey: SharedErrorI18nTypes.ENTITY_ALREADY_EXISTS,
            }),
        ],
        [
            InvalidAttributeLengthError.name,
            new DbiamSharedError({
                code: 400,
                i18nKey: SharedErrorI18nTypes.INVALID_ATTRIBUTE_LENGTH,
            }),
        ],
        [
            InvalidCharacterSetError.name,
            new DbiamSharedError({
                code: 400,
                i18nKey: SharedErrorI18nTypes.INVALID_CHARACTER_SET,
            }),
        ],
        [
            InvalidNameError.name,
            new DbiamSharedError({
                code: 400,
                i18nKey: SharedErrorI18nTypes.INVALID_NAME,
            }),
        ],
        [
            MissingPermissionsError.name,
            new DbiamSharedError({
                code: 404,
                i18nKey: SharedErrorI18nTypes.MISSING_PERMISSIONS,
            }),
        ],
        [
            ExceedsLimitError.name,
            new DbiamSharedError({
                code: 400,
                i18nKey: SharedErrorI18nTypes.EXCEEDS_LIMIT,
            }),
        ],
        [
            UserExternalDataWorkflowError.name,
            new DbiamSharedError({
                code: 500,
                i18nKey: SharedErrorI18nTypes.USER_EXTERNAL_DATA_WORKFLOW_ERROR,
            }),
        ],
    ]);

    public catch(exception: SharedDomainError, host: ArgumentsHost): void {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();

        const dbiamSharedError: DbiamSharedError = this.mapDomainErrorToDbiamError(exception);

        response.status(dbiamSharedError.code);
        response.json(dbiamSharedError);
    }

    private mapDomainErrorToDbiamError(error: SharedDomainError): DbiamSharedError {
        return (
            this.ERROR_MAPPINGS.get(error.constructor.name) ??
            new DbiamSharedError({
                code: 500,
                i18nKey: SharedErrorI18nTypes.INTERNAL,
            })
        );
    }
}
