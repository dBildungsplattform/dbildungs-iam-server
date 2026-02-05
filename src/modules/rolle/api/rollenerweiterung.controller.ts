import { UseFilters, Controller, Post, Param, Body } from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOAuth2,
    ApiOperation,
    ApiInternalServerErrorResponse,
    ApiNoContentResponse,
} from '@nestjs/swagger';
import { Public } from 'nest-keycloak-connect';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { AuthenticationExceptionFilter } from '../../authentication/api/authentication-exception-filter.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { RollenSystemRecht } from '../domain/systemrecht.js';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { ApplyRollenerweiterungPathParams } from './apply-rollenerweiterung-changes.path.params.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { ApplyRollenerweiterungBodyParams } from './apply-rollenerweiterung.body.params.js';
import { ServiceProviderMerkmal } from '../../service-provider/domain/service-provider.enum.js';
import { DomainError, EntityNotFoundError, MissingPermissionsError } from '../../../shared/error/index.js';
import { RollenerweiterungExceptionFilter } from './rollenerweiterung-exception-filter.js';
import { MissingMerkmalVerfuegbarFuerRollenerweiterungError } from '../domain/missing-merkmal-verfuegbar-fuer-rollenerweiterung.error.js';
import { ApplyRollenerweiterungMultiExceptionFilter } from './apply-rollenerweiterung-multi-exception-filter.js';
import { ApplyRollenerweiterungWorkflowAggregate } from '../domain/apply-rollenerweiterungen-workflow.js';
import { ApplyRollenerweiterungWorkflowFactory } from '../domain/apply-rollenerweiterungen-workflow.factory.js';
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
        private readonly serviceProviderRepo: ServiceProviderRepo,
        private readonly organisationRepo: OrganisationRepository,
        private readonly applyRollenerweiterungWorkflowFactory: ApplyRollenerweiterungWorkflowFactory,
    ) {}

    @Post('/angebot/:angebotId/organisation/:organisationId/apply')
    @ApiOperation({ description: 'Apply changes to rollen-erweiterung for a given angebot and organisation.' })
    @Public()
    @ApiNoContentResponse({
        description: 'Changes applied successfully.',
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error',
    })
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
        if (!(await permissions.hasSystemrechtAtOrganisation(orgaId, RollenSystemRecht.ROLLEN_ERWEITERN))) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new MissingPermissionsError('Not authorized')),
            );
        }
        const serviceProvider: Option<ServiceProvider<true>> = await this.serviceProviderRepo.findById(angebotId);
        const organisation: Option<Organisation<true>> = await this.organisationRepo.findById(orgaId);
        if (!organisation) {
            this.logger.error(
                `applyRollenerweiterungChanges called by ${permissions.personFields.username} - ${permissions.personFields.id} for not existing organisation ${params.organisationId}`,
            );
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new EntityNotFoundError('Orga', orgaId)),
            );
        }
        if (!serviceProvider) {
            this.logger.error(
                `applyRollenerweiterungChanges called by ${permissions.personFields.username} - ${permissions.personFields.id} for not existing angebot ${params.angebotId}`,
            );
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new EntityNotFoundError('Angebot', angebotId)),
            );
        }

        if (!serviceProvider.merkmale.includes(ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG)) {
            this.logger.error(
                `applyRollenerweiterungChanges called by ${permissions.personFields.username} - ${permissions.personFields.id} for existing angebot ${params.angebotId} which is not verfuegbar for rollenerweiterung`,
            );
            throw new MissingMerkmalVerfuegbarFuerRollenerweiterungError();
        }
        const applyRollenerweiterungenWorkflow: ApplyRollenerweiterungWorkflowAggregate =
            this.applyRollenerweiterungWorkflowFactory.createNew();
        await applyRollenerweiterungenWorkflow.initialize(orgaId, angebotId);
        const result: Result<null, ApplyRollenerweiterungRolesError> =
            await applyRollenerweiterungenWorkflow.applyRollenerweiterungChanges(body, permissions);
        if (!result.ok) {
            this.logger.error(
                `applyRollenerweiterungChanges called by ${permissions.personFields.username} - ${permissions.personFields.id} for angebotId ${params.angebotId} and organisationId ${params.organisationId} completed with error for rollen: ${result.error.errors
                    .map((e: { id: string | undefined; error: DomainError }) => `${e.id} (${e.error.message})`)
                    .join(', ')}.
                    and success for rollen: ${uniq([
                        ...body.addErweiterungenForRolleIds,
                        ...body.removeErweiterungenForRolleIds,
                    ])
                        .filter(
                            (id: string) =>
                                !result.error.errors
                                    .map((e: { id: string | undefined; error: DomainError }) => e.id)
                                    .includes(id),
                        )
                        .join(', ')}.`,
            );
            throw result.error;
        }
        this.logger.info(
            `applyRollenerweiterungChanges called by ${permissions.personFields.username} - ${permissions.personFields.id} for angebotId ${params.angebotId} and organisationId ${params.organisationId} completed with complete success.`,
        );
    }
}
