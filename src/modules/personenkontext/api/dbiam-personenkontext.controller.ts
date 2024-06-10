import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, UseFilters } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiOAuth2,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DomainError } from '../../../shared/error/index.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { DBiamPersonenkontextService } from '../domain/dbiam-personenkontext.service.js';
import { PersonenkontextFactory } from '../domain/personenkontext.factory.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { DBiamCreatePersonenkontextBodyParams } from './param/dbiam-create-personenkontext.body.params.js';
import { DBiamFindPersonenkontexteByPersonIdParams } from './param/dbiam-find-personenkontext-by-personid.params.js';
import { DBiamPersonenkontextResponse } from './response/dbiam-personenkontext.response.js';
import { PersonenkontextSpecificationError } from '../specification/error/personenkontext-specification.error.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { EventService } from '../../../core/eventbus/index.js';
import { PersonenkontextCreatedEvent } from '../../../shared/events/personenkontext-created.event.js';
import { DbiamPersonenkontextError } from './dbiam-personenkontext.error.js';
import { PersonenkontextExceptionFilter } from './personenkontext-exception-filter.js';
import { DbiamUpdatePersonenkontexteBodyParams } from './param/dbiam-update-personenkontexte.body.params.js';
import { DbiamPersonenkontextFactory } from '../domain/dbiam-personenkontext.factory.js';
import { PersonenkontexteUpdate } from '../domain/personenkontexte-update.js';
import { PersonenkontexteUpdateExceptionFilter } from './personenkontexte-update-exception-filter.js';
import { DbiamPersonenkontexteUpdateError } from './dbiam-personenkontexte-update.error.js';

@UseFilters(
    new SchulConnexValidationErrorFilter(),
    new PersonenkontextExceptionFilter(),
    new PersonenkontexteUpdateExceptionFilter(),
)
@ApiTags('dbiam-personenkontexte')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'dbiam/personenkontext' })
export class DBiamPersonenkontextController {
    public constructor(
        private readonly dbiamPersonenkontextFactory: DbiamPersonenkontextFactory,
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly dbiamPersonenkontextService: DBiamPersonenkontextService,
        private readonly eventService: EventService,
        private readonly personenkontextFactory: PersonenkontextFactory,
    ) {}

    @Get(':personId')
    @ApiOkResponse({
        description: 'The personenkontexte were successfully returned.',
        type: [DBiamPersonenkontextResponse],
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available personenkontexte.' })
    @ApiForbiddenResponse({ description: 'Insufficient permission to get personenkontexte for this user.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting personenkontexte.' })
    public async findPersonenkontextsByPerson(
        @Param() params: DBiamFindPersonenkontexteByPersonIdParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<DBiamPersonenkontextResponse[]> {
        const result: Result<Personenkontext<true>[], DomainError> =
            await this.personenkontextRepo.findByPersonAuthorized(params.personId, permissions);

        if (!result.ok) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result.error),
            );
        }

        return result.value.map((k: Personenkontext<true>) => new DBiamPersonenkontextResponse(k));
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        description: 'Personenkontext was successfully created.',
        type: DBiamPersonenkontextResponse,
    })
    @ApiBadRequestResponse({
        description: 'The personenkontext could not be created, may due to unsatisfied specifications.',
        type: DbiamPersonenkontextError,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create personenkontext.' })
    @ApiForbiddenResponse({ description: 'Insufficient permission to create personenkontext.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating personenkontext.' })
    public async createPersonenkontext(
        @Body() params: DBiamCreatePersonenkontextBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<DBiamPersonenkontextResponse> {
        // Construct new personenkontext
        const newPersonenkontext: Personenkontext<false> = this.personenkontextFactory.createNew(
            params.personId,
            params.organisationId,
            params.rolleId,
        );

        //Check specifications
        const specificationCheckError: Option<PersonenkontextSpecificationError> =
            await this.dbiamPersonenkontextService.checkSpecifications(newPersonenkontext);
        if (specificationCheckError) {
            throw specificationCheckError;
        }

        // Save personenkontext
        const saveResult: Result<Personenkontext<true>, DomainError> = await this.personenkontextRepo.saveAuthorized(
            newPersonenkontext,
            permissions,
        );

        if (!saveResult.ok) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(saveResult.error),
            );
        }
        this.eventService.publish(new PersonenkontextCreatedEvent(saveResult.value.id));

        return new DBiamPersonenkontextResponse(saveResult.value);
    }

    @Put(':personId')
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        description: 'Add or remove personenkontexte as one operation.',
        type: DBiamPersonenkontextResponse,
    })
    @ApiBadRequestResponse({
        description: 'The personenkontexte could not be updated, may due to unsatisfied specifications.',
        type: DbiamPersonenkontexteUpdateError,
    })
    @ApiConflictResponse({ description: 'Changes are conflicting with current state of personenkontexte.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to update personenkontexte.' })
    @ApiForbiddenResponse({ description: 'Insufficient permission to update personenkontexte.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while updating personenkontexte.' })
    public async updatePersonenkontexte(
        @Param() params: DBiamFindPersonenkontexteByPersonIdParams,
        @Body() bodyParams: DbiamUpdatePersonenkontexteBodyParams,
    ): Promise<void> {
        const pkUpdate: PersonenkontexteUpdate = this.dbiamPersonenkontextFactory.createNew(
            params.personId,
            bodyParams.lastModified,
            bodyParams.count,
            bodyParams.personenkontexte,
        );
        const updateError: Option<PersonenkontextSpecificationError> = await pkUpdate.update();
        if (updateError) {
            throw updateError;
        }
    }
}
