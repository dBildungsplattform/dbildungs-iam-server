import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Put, Query, UseFilters } from '@nestjs/common';
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
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { FindPersonenkontextRollenBodyParams } from './param/find-personenkontext-rollen.body.params.js';
import { FindPersonenkontextSchulstrukturknotenBodyParams } from './param/find-personenkontext-schulstrukturknoten.body.params.js';
import { FindRollenResponse } from './response/find-rollen.response.js';
import { FindSchulstrukturknotenResponse } from './response/find-schulstrukturknoten.response.js';
import { PersonenkontextWorkflowAggregate } from '../domain/personenkontext-workflow.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { OrganisationResponseLegacy } from '../../organisation/api/organisation.response.legacy.js';
import { PersonenkontextWorkflowFactory } from '../domain/personenkontext-workflow.factory.js';
import { getMapperToken } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { FindDbiamPersonenkontextWorkflowBodyParams } from './param/dbiam-find-personenkontextworkflow-body.params.js';
import { PersonenkontextWorkflowResponse } from './response/dbiam-personenkontext-workflow-response.js';
import { PersonenkontexteUpdateError } from '../domain/error/personenkontexte-update.error.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { DBiamFindPersonenkontexteByPersonIdParams } from './param/dbiam-find-personenkontext-by-personid.params.js';
import { DbiamUpdatePersonenkontexteBodyParams } from './param/dbiam-update-personenkontexte.body.params.js';
import { PersonenkontexteUpdateResponse } from './response/personenkontexte-update.response.js';

@UseFilters(SchulConnexValidationErrorFilter)
@ApiTags('personenkontext')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'personenkontext' })
export class DbiamPersonenkontextFilterController {
    public constructor(
        private readonly personenkontextWorkflowFactory: PersonenkontextWorkflowFactory,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    @Get('step')
    @ApiOkResponse({
        description: 'Initialize or process data from the person creation form.',
        type: PersonenkontextWorkflowResponse,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available data for personenkontext.' })
    @ApiForbiddenResponse({ description: 'Insufficient permission to get data for personenkontext.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting data for personenkontext.' })
    public async processStep(
        @Query() params: FindDbiamPersonenkontextWorkflowBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<PersonenkontextWorkflowResponse> {
        // Creates a new instance of the workflow aggregate
        const anlage: PersonenkontextWorkflowAggregate = this.personenkontextWorkflowFactory.createNew();

        // Initializes the aggregate with the values of the selected organisation and rolle through the UI
        // (Both values could be undefined when nothing was done yet)
        anlage.initialize(params.organisationId, params.rolleId);

        // Find all possible SSKs
        const organisations: OrganisationDo<true>[] = !params.organisationId
            ? await anlage.findAllSchulstrukturknoten(permissions, params.organisationName, params.limit)
            : [];

        // Find all possible roles under the selected Organisation
        const rollen: Rolle<true>[] = params.organisationId
            ? await anlage.findRollenForOrganisation(permissions, params.organisationId, params.rolleName, params.limit)
            : [];

        const organisationsResponse: OrganisationResponseLegacy[] = this.mapper.mapArray(
            organisations,
            OrganisationDo,
            OrganisationResponseLegacy,
        );

        // Determine canCommit status, by default it's always false unless both the rolle and orga are selected
        let canCommit: boolean = false;
        if (params.organisationId && params.rolleId) {
            canCommit = await anlage.canCommit(permissions, params.organisationId, params.rolleId);
        }

        const response: PersonenkontextWorkflowResponse = new PersonenkontextWorkflowResponse(
            organisationsResponse,
            rollen,
            canCommit,
            params.organisationId,
            params.rolleId,
        );

        return response;
    }

    @Put(':personId')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({
        description:
            'Add or remove personenkontexte as one operation. Returns the Personenkontexte existing after update.',
        type: PersonenkontexteUpdateResponse,
    })
    @ApiBadRequestResponse({
        description: 'The personenkontexte could not be updated, may due to unsatisfied specifications.',
    })
    @ApiConflictResponse({ description: 'Changes are conflicting with current state of personenkontexte.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to update personenkontexte.' })
    @ApiForbiddenResponse({ description: 'Insufficient permission to update personenkontexte.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while updating personenkontexte.' })
    public async commit(
        @Param() params: DBiamFindPersonenkontexteByPersonIdParams,
        @Body() bodyParams: DbiamUpdatePersonenkontexteBodyParams,
    ): Promise<PersonenkontexteUpdateResponse> {
        const anlage: PersonenkontextWorkflowAggregate = this.personenkontextWorkflowFactory.createNew();

        const updateResult: Personenkontext<true>[] | PersonenkontexteUpdateError = await anlage.commit(
            params.personId,
            bodyParams.lastModified,
            bodyParams.count,
            bodyParams.personenkontexte,
        );

        if (updateResult instanceof PersonenkontexteUpdateError) {
            throw updateResult;
        }

        return new PersonenkontexteUpdateResponse(updateResult);
    }

    @Get('rollen')
    @ApiOkResponse({
        description: 'The rollen for a personenkontext were successfully returned.',
        type: FindRollenResponse,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available rolen for personenkontexte.' })
    @ApiForbiddenResponse({ description: 'Insufficient permission to get rollen for personenkontext.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting rollen for personenkontexte.' })
    public async findRollen(
        @Query() params: FindPersonenkontextRollenBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<FindRollenResponse> {
        const anlage: PersonenkontextWorkflowAggregate = this.personenkontextWorkflowFactory.createNew();
        const rollen: Rolle<true>[] = await anlage.findAuthorizedRollen(permissions, params.rolleName, params.limit);
        const response: FindRollenResponse = new FindRollenResponse(rollen, rollen.length);

        return response;
    }

    @Get('schulstrukturknoten')
    @ApiOkResponse({
        description: 'The schulstrukturknoten for a personenkontext were successfully returned.',
        type: FindSchulstrukturknotenResponse,
    })
    @ApiUnauthorizedResponse({
        description: 'Not authorized to get available schulstrukturknoten for personenkontexte.',
    })
    @ApiForbiddenResponse({ description: 'Insufficient permission to get schulstrukturknoten for personenkontext.' })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error while getting schulstrukturknoten for personenkontexte.',
    })
    public async findSchulstrukturknoten(
        @Query() params: FindPersonenkontextSchulstrukturknotenBodyParams,
    ): Promise<FindSchulstrukturknotenResponse> {
        const anlage: PersonenkontextWorkflowAggregate = this.personenkontextWorkflowFactory.createNew();
        const sskName: string = params.sskName ?? '';
        const ssks: OrganisationDo<true>[] = await anlage.findSchulstrukturknoten(
            params.rolleId,
            sskName,
            params.limit,
            true,
        );
        const sskResponses: OrganisationResponseLegacy[] = this.mapper.mapArray(
            ssks,
            OrganisationDo,
            OrganisationResponseLegacy,
        );
        const response: FindSchulstrukturknotenResponse = new FindSchulstrukturknotenResponse(
            sskResponses,
            ssks.length,
        );

        return response;
    }
}
