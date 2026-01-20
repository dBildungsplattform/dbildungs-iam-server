import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    NotImplementedException,
    Param,
    Put,
    Query,
    UseFilters,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOAuth2,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { Paged } from '../../../shared/paging/paged.js';
import { PagedResponse } from '../../../shared/paging/paged.response.js';
import { PagingHeadersObject } from '../../../shared/paging/paging.enums.js';
import { FindPersonenkontextByIdParams } from './param/find-personenkontext-by-id.params.js';
import { PersonendatensatzResponseAutomapper } from '../../person/api/personendatensatz.response-automapper.js';
import { PersonenkontextQueryParams } from './param/personenkontext-query.params.js';
import { PersonenkontextResponse } from './response/personenkontext.response.js';
import { PersonenkontextdatensatzResponse } from './response/personenkontextdatensatz.response.js';
import { DeleteRevisionBodyParams } from '../../person/api/delete-revision.body.params.js';

import { RollenSystemRecht } from '../../rolle/domain/systemrecht.js';
import { DomainError } from '../../../shared/error/index.js';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { PermittedOrgas, PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { PersonIdResponse } from '../../person/api/person-id.response.js';
import { AuthenticationExceptionFilter } from '../../authentication/api/authentication-exception-filter.js';
import { PersonenkontextService } from '../domain/personenkontext.service.js';
import { PersonService } from '../../person/domain/person.service.js';
import { Person } from '../../person/domain/person.js';
import { PersonResponseAutomapper } from '../../person/api/person.response-automapper.js';
import { PersonApiMapper } from '../../person/mapper/person-api.mapper.js';

@UseFilters(SchulConnexValidationErrorFilter, new AuthenticationExceptionFilter())
@ApiTags('personenkontexte')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'personenkontexte' })
export class PersonenkontextController {
    public constructor(
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly personenkontextService: PersonenkontextService,
        private readonly personService: PersonService,
        private readonly personApiMapper: PersonApiMapper,
    ) {}

    @Get(':personenkontextId')
    @ApiOkResponse({
        description: 'The personenkontext was successfully returned.',
        type: PersonendatensatzResponseAutomapper,
    })
    @ApiBadRequestResponse({ description: 'Request has wrong format.' })
    @ApiUnauthorizedResponse({ description: 'Request is not authorized.' })
    @ApiNotFoundResponse({ description: 'The personenkontext was not found.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to perform operation.' })
    @ApiInternalServerErrorResponse({ description: 'An internal server error occurred.' })
    public async findPersonenkontextById(
        @Param() params: FindPersonenkontextByIdParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<PersonendatensatzResponseAutomapper> {
        const result: Result<Personenkontext<true>, DomainError> = await this.personenkontextRepo.findByIDAuthorized(
            params.personenkontextId,
            permissions,
        );
        if (!result.ok) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result.error),
            );
        }

        const personenkontext: Personenkontext<true> = result.value;

        const personResult: Result<Person<true>, DomainError> = await this.personService.findPersonById(
            personenkontext.personId,
        );

        if (!personResult.ok) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(personResult.error),
            );
        }

        return new PersonendatensatzResponseAutomapper(new PersonResponseAutomapper(personResult.value), [
            await this.personApiMapper.mapToPersonenkontextResponse(personenkontext),
        ]);
    }

    @Get()
    @ApiOkResponse({
        description: 'The personenkontexte were successfully returned.',
        type: [PersonenkontextdatensatzResponse],
        headers: PagingHeadersObject,
    })
    @ApiBadRequestResponse({ description: 'Request has wrong format.' })
    @ApiUnauthorizedResponse({ description: 'Request is not authorized.' })
    @ApiNotFoundResponse({ description: 'The personenkontexte were not found.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to perform operation.' })
    @ApiInternalServerErrorResponse({ description: 'An internal server error occurred.' })
    public async findPersonenkontexte(
        @Query() queryParams: PersonenkontextQueryParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<PagedResponse<PersonenkontextdatensatzResponse>> {
        const permittedOrgas: PermittedOrgas = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.PERSONEN_VERWALTEN, RollenSystemRecht.PERSONEN_LESEN],
            true,
            false,
        );

        const result: Paged<Personenkontext<true>> = await this.personenkontextService.findAllPersonenkontexte(
            queryParams,
            permittedOrgas.all ? undefined : permittedOrgas.orgaIds,
            queryParams.offset,
            queryParams.limit,
        );

        const responseItems: PersonenkontextdatensatzResponse[] = await Promise.all(
            result.items.map(
                async (personenkontext: Personenkontext<true>) =>
                    new PersonenkontextdatensatzResponse(new PersonIdResponse({ id: personenkontext.personId }), [
                        await this.personApiMapper.mapToPersonenkontextResponse(personenkontext),
                    ]),
            ),
        );

        const response: PagedResponse<PersonenkontextdatensatzResponse> = new PagedResponse({
            items: responseItems,
            total: result.total,
            offset: result.offset,
            limit: result.limit,
        });

        return response;
    }

    @Put(':personenkontextId')
    @ApiOperation({ deprecated: true })
    @ApiParam({ name: 'personenkontextId', type: String })
    @ApiOkResponse({
        description: 'The personenkontext was successfully updated.',
        type: PersonenkontextResponse,
    })
    @ApiBadRequestResponse({ description: 'Request has wrong format.' })
    @ApiUnauthorizedResponse({ description: 'Request is not authorized.' })
    @ApiNotFoundResponse({ description: 'The personenkontext was not found.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to perform operation.' })
    @ApiInternalServerErrorResponse({ description: 'An internal server error occurred.' })
    public updatePersonenkontextWithId(): Promise<PersonendatensatzResponseAutomapper> {
        throw new NotImplementedException();
    }

    @Delete(':personenkontextId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({
        description: 'The personenkontext was successfully deleted.',
    })
    @ApiBadRequestResponse({ description: 'Request has wrong format.' })
    @ApiUnauthorizedResponse({ description: 'Request is not authorized.' })
    @ApiNotFoundResponse({ description: 'The personenkontext was not found.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to perform operation.' })
    @ApiInternalServerErrorResponse({ description: 'An internal server error occurred.' })
    public async deletePersonenkontextById(
        @Param() params: FindPersonenkontextByIdParams,
        @Body() body: DeleteRevisionBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<void> {
        // Check permissions
        const result: Result<unknown, DomainError> = await this.personenkontextRepo.findByIDAuthorized(
            params.personenkontextId,
            permissions,
        );
        if (!result.ok) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result.error),
            );
        }

        const deleteResult: Result<void, DomainError> = await this.personenkontextService.deletePersonenkontextById(
            params.personenkontextId,
            body.revision,
        );

        if (!deleteResult.ok) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(deleteResult.error),
            );
        }
    }
}
