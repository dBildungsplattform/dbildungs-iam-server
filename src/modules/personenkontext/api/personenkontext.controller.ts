import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
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
import { UpdatePersonenkontextBodyParams } from './param/update-personenkontext.body.params.js';
import { DeleteRevisionBodyParams } from '../../person/api/delete-revision.body.params.js';
import { DeletePersonenkontextDto } from './delete-personkontext.dto.js';
import { SystemrechtResponse } from './response/personenkontext-systemrecht.response.js';
import { PersonByIdParams } from '../../person/api/person-by-id.param.js';
import { HatSystemrechtQueryParams } from './param/hat-systemrecht.query.params.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { DomainError, EntityNotFoundError } from '../../../shared/error/index.js';
import { isEnum } from 'class-validator';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { DBiamPersonenkontextRepo } from '../persistence/dbiam-personenkontext.repo.js';
import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';
import { Personenkontext } from '../domain/personenkontext.js';
import { PersonIdResponse } from '../../person/api/person-id.response.js';
import { AuthenticationExceptionFilter } from '../../authentication/api/authentication-exception-filter.js';
import { PersonenkontextService } from '../domain/personenkontext.service.js';
import { PersonService } from '../../person/domain/person.service.js';
import { Person } from '../../person/domain/person.js';
import { PersonResponseAutomapper } from '../../person/api/person.response-automapper.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { Rolle } from '../../rolle/domain/rolle.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { OrganisationService } from '../../organisation/domain/organisation.service.js';
import { OrganisationResponseLegacy } from '../../organisation/api/organisation.response.legacy.js';

@UseFilters(SchulConnexValidationErrorFilter, new AuthenticationExceptionFilter())
@ApiTags('personenkontexte')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'personenkontexte' })
export class PersonenkontextController {
    public constructor(
        @Inject(getMapperToken()) private readonly mapper: Mapper,
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly personenkontextService: PersonenkontextService,
        private readonly personService: PersonService,
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepository: OrganisationRepository,
        private readonly organisationService: OrganisationService,
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
        const result: Result<unknown, DomainError> = await this.personenkontextRepo.findByIDAuthorized(
            params.personenkontextId,
            permissions,
        );
        if (!result.ok) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result.error),
            );
        }

        const personenkontextResult: Result<
            Personenkontext<true>,
            DomainError
        > = await this.personenkontextService.findPersonenkontextById(params.personenkontextId);

        if (!personenkontextResult.ok) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(personenkontextResult.error),
            );
        }

        const personResult: Result<Person<true>, DomainError> = await this.personService.findPersonById(
            personenkontextResult.value.personId,
        );

        if (!personResult.ok) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(personResult.error),
            );
        }

        return new PersonendatensatzResponseAutomapper(new PersonResponseAutomapper(personResult.value), [
            await PersonenkontextResponse.construct(personenkontextResult.value),
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
        const organisationIDs: OrganisationID[] = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.PERSONEN_VERWALTEN],
            true,
        );

        const result: Paged<Personenkontext<true>> = await this.personenkontextService.findAllPersonenkontexte(
            queryParams,
            organisationIDs,
            queryParams.offset,
            queryParams.limit,
        );

        const responseItems: PersonenkontextdatensatzResponse[] = await Promise.all(
            result.items.map(
                async (personenkontext: Personenkontext<true>) =>
                    new PersonenkontextdatensatzResponse(new PersonIdResponse({ id: personenkontext.personId }), [
                        await PersonenkontextResponse.construct(personenkontext),
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

    @Get(':personId/hatSystemrecht')
    @ApiOkResponse({
        type: SystemrechtResponse,
        description: 'The SchulStrukturKnoten associated with this personId and systemrecht. Can return empty list',
    })
    @ApiNotFoundResponse({ description: 'The systemrecht could not be found (does not exist as type of systemrecht).' })
    public async hatSystemRecht(
        @Param() personByIdParams: PersonByIdParams,
        @Query() hatSystemrechtQueryParams: HatSystemrechtQueryParams,
    ): Promise<SystemrechtResponse> {
        if (!isEnum(hatSystemrechtQueryParams.systemRecht, RollenSystemRecht)) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new EntityNotFoundError()),
            );
        }
        const systemrecht: RollenSystemRecht = hatSystemrechtQueryParams.systemRecht as RollenSystemRecht;

        const organisations: Organisation<true>[] = [];
        const personenkontexte: Personenkontext<true>[] =
            await this.personenkontextService.findPersonenkontexteByPersonId(personByIdParams.personId);

        for (const personenkontext of personenkontexte) {
            const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(personenkontext.rolleId);
            if (!rolle) continue;
            if (rolle.hasSystemRecht(systemrecht)) {
                const organisation: Option<Organisation<true>> = await this.organisationRepository.findById(
                    personenkontext.organisationId,
                );
                if (organisation) {
                    organisations.push(organisation);
                    const children: Option<Paged<Organisation<true>>> =
                        await this.organisationService.findAllAdministriertVon(personenkontext.organisationId);
                    organisations.push(...children.items);
                }
            }
        }
        const systemrechtResponse: SystemrechtResponse = new SystemrechtResponse();

        const organisationResponses: OrganisationResponseLegacy[] = organisations.map(
            (org: Organisation<true>) => new OrganisationResponseLegacy(org),
        );
        systemrechtResponse[RollenSystemRecht.ROLLEN_VERWALTEN] = organisationResponses;

        return systemrechtResponse;
    }

    @Put(':personenkontextId')
    @ApiOkResponse({
        description: 'The personenkontext was successfully updated.',
        type: PersonenkontextResponse,
    })
    @ApiBadRequestResponse({ description: 'Request has wrong format.' })
    @ApiUnauthorizedResponse({ description: 'Request is not authorized.' })
    @ApiNotFoundResponse({ description: 'The personenkontext was not found.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to perform operation.' })
    @ApiInternalServerErrorResponse({ description: 'An internal server error occurred.' })
    public async updatePersonenkontextWithId(
        @Param() params: FindPersonenkontextByIdParams,
        @Body() body: UpdatePersonenkontextBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<PersonendatensatzResponseAutomapper> {
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

        //!!! Note: rename this
        const dto: UpdatePersonenkontextBodyParams = body;
        dto.id = params.personenkontextId;

        const updateResult: Result<
            Personenkontext<true>,
            DomainError
        > = await this.personenkontextService.updatePersonenkontext(dto);

        if (!updateResult.ok) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(updateResult.error),
            );
        }

        const personResult: Result<Person<true>, DomainError> = await this.personService.findPersonById(
            updateResult.value.personId,
        );

        if (!personResult.ok) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(personResult.error),
            );
        }

        return new PersonendatensatzResponseAutomapper(new PersonResponseAutomapper(personResult.value), [
            await PersonenkontextResponse.construct(updateResult.value),
        ]);
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
        //!!! rename this
        const dto: DeletePersonenkontextDto = this.mapper.map(body, DeleteRevisionBodyParams, DeletePersonenkontextDto);
        dto.id = params.personenkontextId;

        const deleteResult: Result<void, DomainError> = await this.personenkontextService.deletePersonenkontextById(
            dto.id,
            dto.revision,
        );

        if (!deleteResult.ok) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(deleteResult.error),
            );
        }
    }
}
