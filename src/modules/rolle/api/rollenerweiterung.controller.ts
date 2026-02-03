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
import { ApplyRollenerweiterungPathParams } from './applyRollenerweiterungChanges.path.params.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { ApplyRollenerweiterungBodyParams } from './applyRollenerweiterung.body.params.js';
import { ServiceProviderMerkmal } from '../../service-provider/domain/service-provider.enum.js';
import { EntityNotFoundError, MissingPermissionsError } from '../../../shared/error/index.js';
import { RollenerweiterungExceptionFilter } from './rollenerweiterung-exception-filter.js';
import { MissingMerkmalVerfuegbarFuerRollenerweiterungError } from '../domain/missing-merkmal-verfuegbar-fuer-rollenerweiterung.error.js';
import { ApplyRollenerweiterungMultiExceptionFilter } from './apply-rollenerweiterung-multi-exception-filter.js';
import { ApplyRollenerweiterungWorkflowAggregate } from '../domain/apply-rollenerweiterungen-workflow.js';
import { ApplyRollenerweiterungWorkflowFactory } from '../domain/apply-rollenerweiterungen-workflow.factory.js';
import { ApplyRollenerweiterungRolesError } from './apply-rollenerweiterung-roles.error.js';

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
            `applyRollenerweiterungChanges called by ${permissions.personFields.id} for angebotId ${params.angebotId} and organisationId ${params.organisationId} with ${body.addErweiterungenForRolleIds.length} additions and ${body.removeErweiterungenForRolleIds.length} removals.`,
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
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new EntityNotFoundError('Orga', orgaId)),
            );
        }
        if (!serviceProvider) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new EntityNotFoundError('Angebot', angebotId)),
            );
        }

        if (!serviceProvider.merkmale.includes(ServiceProviderMerkmal.VERFUEGBAR_FUER_ROLLENERWEITERUNG)) {
            throw new MissingMerkmalVerfuegbarFuerRollenerweiterungError();
        }
        const applyRollenerweiterungenWorkflow: ApplyRollenerweiterungWorkflowAggregate =
            this.applyRollenerweiterungWorkflowFactory.createNew();
        await applyRollenerweiterungenWorkflow.initialize(orgaId, angebotId);
        const result: Result<null, ApplyRollenerweiterungRolesError> =
            await applyRollenerweiterungenWorkflow.applyRollenerweiterungChanges(body, permissions);
        if (!result.ok) {
            throw result.error;
        }
    }
}
