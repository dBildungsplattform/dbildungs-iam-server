import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put, Query, UseFilters, UseGuards } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiConflictResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiOAuth2,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { DomainError } from '../../../shared/error/domain.error.js';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { StepUpGuard } from '../../authentication/api/steup-up.guard.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationResponseLegacy } from '../../organisation/api/organisation.response.legacy.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { DbiamPersonenkontexteUpdateError } from '../../personenkontext/api/dbiam-personenkontexte-update.error.js';
import { PersonenkontexteUpdateResponse } from '../../personenkontext/api/response/personenkontexte-update.response.js';
import { PersonenkontexteUpdateError } from '../../personenkontext/domain/error/personenkontexte-update.error.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { LandesbediensteterWorkflowFactory } from '../domain/landesbediensteter-workflow.factory.js';
import { LandesbediensteterWorkflowAggregate } from '../domain/landesbediensteter-workflow.js';
import { LandesbediensteterPersonIdParams } from './param/landesbediensteter-person-id.params.js';
import { LandesbediensteterWorkflowCommitBodyParams } from './param/landesbediensteter-workflow-commit.body.params.js';
import { LandesbediensteterWorkflowStepBodyParams } from './param/landesbediensteter-workflow-step.body.params.js';
import { LandesbediensteterWorkflowStepResponse } from './response/landesbediensteter-workflow-step.response.js';
import { LandesbediensteterExceptionFilter } from './landesbediensteter-exception-filter.js';
import { PersonenkontexteUpdateExceptionFilter } from '../../personenkontext/api/personenkontexte-update-exception-filter.js';
import { AuthenticationExceptionFilter } from '../../authentication/api/authentication-exception-filter.js';

@ApiTags('landesbediensteter')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'landesbediensteter' })
@UseFilters(PersonenkontexteUpdateExceptionFilter, LandesbediensteterExceptionFilter, AuthenticationExceptionFilter)
export class LandesbediensteterController {
    public constructor(public readonly landesbediensteteWorkflowFactory: LandesbediensteterWorkflowFactory) {}

    @Get('step')
    @UseGuards(StepUpGuard)
    @ApiOkResponse({
        description: `Initialize or process data from the landesbedienstete form.
Valid combinations:
- Both organisationId and rolleId are undefined: Fetch all possible organisations.
- organisationId is provided, but rolleId is undefined: Fetch Rollen for the given organisation.
- Both organisationId and rolleId are provided: Check if the Rolle can be committed for the organisation.
Note: Providing rolleId without organisationId is invalid.`,
        type: LandesbediensteterWorkflowStepResponse,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available data.' })
    @ApiForbiddenResponse({ description: 'Insufficient permission to get data.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting data.' })
    public async step(
        @Query() params: LandesbediensteterWorkflowStepBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<LandesbediensteterWorkflowStepResponse> {
        const workflow: LandesbediensteterWorkflowAggregate = this.landesbediensteteWorkflowFactory.createNew();

        workflow.initialize(params.organisationId, params.rollenIds);

        const organisations: Organisation<true>[] = await workflow.findAllSchulstrukturknoten(
            permissions,
            params.organisationName,
            undefined,
            params.limit,
        );

        const rollen: Rolle<true>[] = params.organisationId
            ? await workflow.findRollenForOrganisation(permissions, params.rolleName, params.rollenIds, params.limit)
            : [];

        let canCommit: boolean = false;
        if (params.organisationId && params.rollenIds) {
            const commitResult: Result<void, DomainError> = await workflow.canCommit(permissions);
            if (commitResult.ok) {
                canCommit = true;
            }
        }

        return new LandesbediensteterWorkflowStepResponse(
            organisations.map((org: Organisation<true>) => new OrganisationResponseLegacy(org)),
            rollen,
            canCommit,
            params.organisationId,
            params.rollenIds,
        );
    }

    @Put(':personId')
    @UseGuards(StepUpGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        description: 'Add personenkontexte as one operation. Returns the Personenkontexte existing after update.',
        type: PersonenkontexteUpdateResponse,
    })
    @ApiBadRequestResponse({
        description: 'The personenkontexte could not be updated, maybe due to unsatisfied specifications.',
        type: DbiamPersonenkontexteUpdateError,
    })
    @ApiConflictResponse({ description: 'Changes are conflicting with current state of personenkontexte.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to update personenkontexte.' })
    @ApiForbiddenResponse({ description: 'Insufficient permission to update personenkontexte.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while updating personenkontexte.' })
    public async commit(
        @Param() params: LandesbediensteterPersonIdParams,
        @Body() bodyParams: LandesbediensteterWorkflowCommitBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<PersonenkontexteUpdateResponse> {
        const updateResult: Result<Personenkontext<true>[], PersonenkontexteUpdateError> =
            await this.landesbediensteteWorkflowFactory
                .createNew()
                .commit(
                    params.personId,
                    bodyParams.lastModified,
                    bodyParams.count,
                    bodyParams.newPersonenkontexte,
                    permissions,
                    bodyParams.personalnummer,
                );

        if (!updateResult.ok) {
            throw updateResult.error;
        }

        return new PersonenkontexteUpdateResponse(updateResult.value);
    }
}
