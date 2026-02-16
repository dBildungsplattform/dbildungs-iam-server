import { UseFilters, Controller, Post, Param, Body, HttpCode } from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOAuth2,
    ApiOperation,
    ApiInternalServerErrorResponse,
    ApiNoContentResponse,
} from '@nestjs/swagger';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { AuthenticationExceptionFilter } from '../../authentication/api/authentication-exception-filter.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { ApplyRollenerweiterungPathParams } from './apply-rollenerweiterung-changes.path.params.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { ApplyRollenerweiterungBodyParams } from './apply-rollenerweiterung.body.params.js';
import { DomainError, EntityNotFoundError, MissingPermissionsError } from '../../../shared/error/index.js';
import { RollenerweiterungExceptionFilter } from './rollenerweiterung-exception-filter.js';
import { MissingMerkmalVerfuegbarFuerRollenerweiterungError } from '../domain/missing-merkmal-verfuegbar-fuer-rollenerweiterung.error.js';
import { ApplyRollenerweiterungMultiExceptionFilter } from './apply-rollenerweiterung-multi-exception-filter.js';
import { ApplyRollenerweiterungService } from '../domain/apply-rollenerweiterungen-service.js';
import { ApplyRollenerweiterungRolesError } from './apply-rollenerweiterung-roles.error.js';
import { uniq } from 'lodash-es';

@UseFilters(
    new SchulConnexValidationErrorFilter(),
    new AuthenticationExceptionFilter(),
    new RollenerweiterungExceptionFilter(),
    new ApplyRollenerweiterungMultiExceptionFilter(),
)
@ApiTags('rolle')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'rollen-erweiterung' })
export class RollenerweiterungController {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly applyRollenerweiterungService: ApplyRollenerweiterungService,
    ) {}

    @Post('/angebot/:angebotId/organisation/:organisationId/apply')
    @ApiOperation({ description: 'Apply changes to rollen-erweiterung for a given angebot and organisation.' })
    @ApiNoContentResponse({
        description: 'Changes applied successfully.',
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error',
    })
    @HttpCode(204)
    public async applyRollenerweiterungChanges(
        @Param() params: ApplyRollenerweiterungPathParams,
        @Body() body: ApplyRollenerweiterungBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<void> {
        this.logger.info(
            `applyRollenerweiterungChanges called by ${permissions.personFields.username} - ${permissions.personFields.id} for angebotId ${params.angebotId} and organisationId ${params.organisationId} with ${body.addErweiterungenForRolleIds.length} x ADD (${[...body.addErweiterungenForRolleIds].map((id: string) => id).join(', ')}) and ${body.removeErweiterungenForRolleIds.length} x REMOVE (${[...body.removeErweiterungenForRolleIds].map((id: string) => id).join(', ')}).`,
        );
        const angebotId: string = params.angebotId;
        const orgaId: string = params.organisationId;
        const result: Result<
            null,
            | ApplyRollenerweiterungRolesError
            | EntityNotFoundError
            | MissingPermissionsError
            | MissingMerkmalVerfuegbarFuerRollenerweiterungError
        > = await this.applyRollenerweiterungService.applyRollenerweiterungChanges(
            orgaId,
            angebotId,
            body,
            permissions,
        );
        if (!result.ok) {
            const err:
                | ApplyRollenerweiterungRolesError
                | EntityNotFoundError
                | MissingPermissionsError
                | MissingMerkmalVerfuegbarFuerRollenerweiterungError = result.error;
            if (err instanceof ApplyRollenerweiterungRolesError) {
                this.logger.error(
                    `applyRollenerweiterungChanges called by ${permissions.personFields.username} - ${permissions.personFields.id} for angebotId ${params.angebotId} and organisationId ${params.organisationId} completed with error for rollen: ${err.errors
                        .map((e: { id: string | undefined; error: DomainError }) => `${e.id} (${e.error.message})`)
                        .join(', ')}.
                    and success for rollen: ${uniq([
                        ...body.addErweiterungenForRolleIds,
                        ...body.removeErweiterungenForRolleIds,
                    ])
                        .filter(
                            (id: string) =>
                                !err.errors
                                    .map((e: { id: string | undefined; error: DomainError }) => e.id)
                                    .includes(id),
                        )
                        .join(', ')}.`,
                );
                throw result.error;
            } else if (err instanceof MissingPermissionsError || err instanceof EntityNotFoundError) {
                throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                    SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(err),
                );
            } else {
                throw result.error;
            }
        }
        this.logger.info(
            `applyRollenerweiterungChanges called by ${permissions.personFields.username} - ${permissions.personFields.id} for angebotId ${params.angebotId} and organisationId ${params.organisationId} completed with complete success.`,
        );
    }
}
