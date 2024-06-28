import { Body, Controller, HttpCode, HttpStatus, Post, UseFilters } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiOAuth2,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DomainError } from '../../../shared/error/index.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { PersonPersonenkontext, PersonService } from '../domain/person.service.js';
import { DbiamCreatePersonWithContextBodyParams } from './dbiam-create-person-with-context.body.params.js';
import { DBiamPersonResponse } from './dbiam-person.response.js';
import { DbiamPersonenkontextError } from '../../personenkontext/api/dbiam-personenkontext.error.js';
import { PersonenkontextExceptionFilter } from '../../personenkontext/api/personenkontext-exception-filter.js';
import { PersonenkontextSpecificationError } from '../../personenkontext/specification/error/personenkontext-specification.error.js';

@UseFilters(new SchulConnexValidationErrorFilter(), new PersonenkontextExceptionFilter())
@ApiTags('dbiam-personen')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'dbiam/personen' })
export class DBiamPersonController {
    public constructor(private readonly personService: PersonService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        description: 'Person with Personenkontext was successfully created.',
        type: DBiamPersonResponse,
    })
    @ApiBadRequestResponse({
        description: 'The person and the personenkontext could not be created, may due to unsatisfied specifications.',
        type: DbiamPersonenkontextError,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create person with personenkontext.' })
    @ApiForbiddenResponse({ description: 'Insufficient permission to create person with personenkontext.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to create the person with personenkontext.' })
    @ApiBadRequestResponse({ description: 'Request has wrong format.', type: DbiamPersonenkontextError })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error while creating person with personenkontext.',
    })
    public async createPersonWithKontext(
        @Body() params: DbiamCreatePersonWithContextBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<DBiamPersonResponse> {
        //Check all references & permissions then save person
        const savedPersonWithPersonenkontext: DomainError | PersonPersonenkontext =
            await this.personService.createPersonWithPersonenkontext(
                permissions,
                params.vorname,
                params.familienname,
                params.organisationId,
                params.rolleId,
            );

        if (savedPersonWithPersonenkontext instanceof PersonenkontextSpecificationError) {
            throw savedPersonWithPersonenkontext;
        }

        if (savedPersonWithPersonenkontext instanceof DomainError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(savedPersonWithPersonenkontext),
            );
        }

        return new DBiamPersonResponse(
            savedPersonWithPersonenkontext.person,
            savedPersonWithPersonenkontext.personenkontext,
        );
    }
}
