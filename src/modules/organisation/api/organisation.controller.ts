import { Mapper } from '@automapper/core';
import { getMapperToken } from '@automapper/nestjs';
import { Body, Controller, Get, Inject, Param, Patch, Post, Put, Query, UseFilters } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOAuth2,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { Paged, PagingHeadersObject } from '../../../shared/paging/index.js';
import { PagedResponse } from '../../../shared/paging/paged.response.js';
import { CreateOrganisationBodyParams } from './create-organisation.body.params.js';
import { CreateOrganisationDto } from './create-organisation.dto.js';
import { CreatedOrganisationDto } from './created-organisation.dto.js';
import { FindOrganisationQueryParams } from './find-organisation-query.param.js';
import { OrganisationByIdParams } from './organisation-by-id.params.js';
import { OrganisationResponseLegacy } from './organisation.response.legacy.js';
import { OrganisationUc } from './organisation.uc.js';
import { UpdateOrganisationBodyParams } from './update-organisation.body.params.js';
import { UpdateOrganisationDto } from './update-organisation.dto.js';
import { UpdatedOrganisationDto } from './updated-organisation.dto.js';
import { OrganisationByIdBodyParams } from './organisation-by-id.body.params.js';
import { OrganisationRepository } from '../persistence/organisation.repository.js';
import { OrganisationScope } from '../persistence/organisation.scope.js';
import { Organisation } from '../domain/organisation.js';
import { ScopeOperator } from '../../../shared/persistence/index.js';
import { OrganisationResponse } from './organisation.response.js';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { OrganisationID } from '../../../shared/types/aggregate-ids.types.js';
import { OrganisationRootChildrenResponse } from './organisation.root-children.response.js';
import { DomainError, EntityNotFoundError } from '../../../shared/error/index.js';
import { DbiamOrganisationError } from './dbiam-organisation.error.js';
import { OrganisationExceptionFilter } from './organisation-exception-filter.js';
import { OrganisationSpecificationError } from '../specification/error/organisation-specification.error.js';
import { OrganisationByNameQueryParams } from './organisation-by-name.query.js';
import { OrganisationsTyp } from '../domain/organisation.enums.js';
import { AuthenticationExceptionFilter } from '../../authentication/api/authentication-exception-filter.js';
import { OrganisationByNameBodyParams } from './organisation-by-name.body.params.js';

@UseFilters(
    new SchulConnexValidationErrorFilter(),
    new OrganisationExceptionFilter(),
    new AuthenticationExceptionFilter(),
)
@ApiTags('organisationen')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'organisationen' })
export class OrganisationController {
    public constructor(
        private readonly uc: OrganisationUc,
        private readonly organisationRepository: OrganisationRepository,
        @Inject(getMapperToken()) private readonly mapper: Mapper,
    ) {}

    @Post()
    @ApiCreatedResponse({ description: 'The organisation was successfully created.', type: OrganisationResponseLegacy })
    @ApiBadRequestResponse({ description: 'The organisation already exists.', type: DbiamOrganisationError })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create the organisation.' })
    @ApiForbiddenResponse({ description: 'Not permitted to create the organisation.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating the organisation.' })
    public async createOrganisation(@Body() params: CreateOrganisationBodyParams): Promise<OrganisationResponseLegacy> {
        const organisationDto: CreateOrganisationDto = this.mapper.map(
            params,
            CreateOrganisationBodyParams,
            CreateOrganisationDto,
        );
        const result: CreatedOrganisationDto | SchulConnexError | OrganisationSpecificationError =
            await this.uc.createOrganisation(organisationDto);

        if (result instanceof CreatedOrganisationDto) {
            return this.mapper.map(result, CreatedOrganisationDto, OrganisationResponseLegacy);
        }
        if (result instanceof OrganisationSpecificationError) {
            throw result;
        }
        throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(result);
    }

    @Put(':organisationId')
    @ApiOkResponse({
        description: 'The organisation was successfully updated.',
        type: OrganisationResponseLegacy,
    })
    @ApiBadRequestResponse({ description: 'Request has wrong format.', type: DbiamOrganisationError })
    @ApiUnauthorizedResponse({ description: 'Request is not authorized.' })
    @ApiNotFoundResponse({ description: 'The organisation was not found.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to perform operation.' })
    @ApiInternalServerErrorResponse({ description: 'An internal server error occurred.' })
    public async updateOrganisation(
        @Param() params: OrganisationByIdParams,
        @Body() body: UpdateOrganisationBodyParams,
    ): Promise<OrganisationResponseLegacy> {
        const dto: UpdateOrganisationDto = this.mapper.map(body, UpdateOrganisationBodyParams, UpdateOrganisationDto);
        dto.id = params.organisationId;

        const response: UpdatedOrganisationDto | SchulConnexError | OrganisationSpecificationError =
            await this.uc.updateOrganisation(dto);

        if (response instanceof UpdatedOrganisationDto) {
            return this.mapper.map(response, UpdatedOrganisationDto, OrganisationResponseLegacy);
        }
        if (response instanceof OrganisationSpecificationError) {
            throw response;
        }
        throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(response);
    }

    @Get('root')
    @ApiOkResponse({ description: 'The organization was successfully pulled.', type: OrganisationResponseLegacy })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get the organization.' })
    @ApiNotFoundResponse({ description: 'The organization does not exist.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get the organization.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting the organization.' })
    public async getRootOrganisation(): Promise<OrganisationResponseLegacy> {
        const result: OrganisationResponseLegacy | SchulConnexError = await this.uc.findRootOrganisation();

        if (result instanceof OrganisationResponseLegacy) {
            return result;
        }

        throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(result);
    }

    @Get('root/children')
    @ApiOkResponse({
        description: 'The root organizations were successfully pulled.',
        type: OrganisationRootChildrenResponse,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get the organizations.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get the organizations.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting the organization.' })
    public async getRootChildren(): Promise<OrganisationRootChildrenResponse> {
        const [oeffentlich, ersatz]: [Organisation<true> | undefined, Organisation<true> | undefined] =
            await this.organisationRepository.findRootDirectChildren();

        if (!oeffentlich || !ersatz) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityNotFoundError('Organisation', `${!oeffentlich && 'Oeffentlich'} ${!ersatz && 'Ersatz'}`),
                ),
            );
        }

        return new OrganisationRootChildrenResponse(oeffentlich, ersatz);
    }

    @Get(':organisationId')
    @ApiOkResponse({ description: 'The organization was successfully pulled.', type: OrganisationResponseLegacy })
    @ApiBadRequestResponse({ description: 'Organization ID is required' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get the organization.' })
    @ApiNotFoundResponse({ description: 'The organization does not exist.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get the organization.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting the organization.' })
    public async findOrganisationById(@Param() params: OrganisationByIdParams): Promise<OrganisationResponseLegacy> {
        const result: OrganisationResponseLegacy | SchulConnexError = await this.uc.findOrganisationById(
            params.organisationId,
        );

        if (result instanceof OrganisationResponseLegacy) {
            return result;
        }
        throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(result);
    }

    @Get()
    @ApiOkResponse({
        description: 'The organizations were successfully returned.',
        type: [OrganisationResponse],
        headers: PagingHeadersObject,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get organizations.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get organizations.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all organizations.' })
    public async findOrganizations(
        @Query() queryParams: FindOrganisationQueryParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<PagedResponse<OrganisationResponse>> {
        const validOrgaIDs: OrganisationID[] = await permissions.getOrgIdsWithSystemrecht(
            queryParams.systemrechte,
            true,
        );

        const scope: OrganisationScope = new OrganisationScope();

        // If the typ is Klasse then only search by Name using the search string
        if (queryParams.typ === OrganisationsTyp.KLASSE) {
            scope
                .findBy({
                    kennung: queryParams.kennung,
                    name: queryParams.name,
                    typ: queryParams.typ,
                })
                .setScopeWhereOperator(ScopeOperator.AND)
                .findByAdministriertVonArray(queryParams.administriertVon)
                .searchStringAdministriertVon(queryParams.searchString)
                .excludeTyp(queryParams.excludeTyp)
                .byIDs(validOrgaIDs)
                .paged(queryParams.offset, queryParams.limit);
        }
        scope
            .findBy({
                kennung: queryParams.kennung,
                name: queryParams.name,
                typ: queryParams.typ,
            })
            .setScopeWhereOperator(ScopeOperator.AND)
            .findByAdministriertVonArray(queryParams.administriertVon)
            .searchString(queryParams.searchString)
            .excludeTyp(queryParams.excludeTyp)
            .byIDs(validOrgaIDs)
            .paged(queryParams.offset, queryParams.limit);

        const [organisations, total]: Counted<Organisation<true>> = await this.organisationRepository.findBy(scope);
        const organisationResponses: OrganisationResponse[] = organisations.map((organisation: Organisation<true>) => {
            return new OrganisationResponse(organisation);
        });
        const pagedOrganisationResponse: Paged<OrganisationResponse> = {
            total: total,
            offset: queryParams.offset ?? 0,
            limit: queryParams.limit ?? total,
            items: organisationResponses,
        };

        return new PagedResponse(pagedOrganisationResponse);
    }

    @Get(':organisationId/administriert')
    @ApiOkResponse({
        description: 'The organizations were successfully returned.',
        type: [OrganisationResponseLegacy],
        headers: PagingHeadersObject,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get organizations.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get organizations.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all organizations.' })
    public async getAdministrierteOrganisationen(
        @Param() routeParams: OrganisationByIdParams,
        @Query() queryParams: OrganisationByNameQueryParams,
    ): Promise<PagedResponse<OrganisationResponseLegacy>> {
        const result: Paged<OrganisationResponseLegacy> | SchulConnexError = await this.uc.findAdministriertVon(
            routeParams.organisationId,
            queryParams.searchFilter,
            queryParams.limit,
            queryParams.offset,
        );

        if (result instanceof SchulConnexError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(result);
        }
        const response: PagedResponse<OrganisationResponseLegacy> = new PagedResponse(result);

        return response;
    }

    @Post(':organisationId/administriert')
    @ApiCreatedResponse({ description: 'The organisation was successfully updated.' })
    @ApiBadRequestResponse({ description: 'The organisation could not be modified.', type: DbiamOrganisationError })
    @ApiUnauthorizedResponse({ description: 'Not authorized to modify the organisation.' })
    @ApiForbiddenResponse({ description: 'Not permitted to modify the organisation.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while modifying the organisation.' })
    public async addAdministrierteOrganisation(
        @Param() params: OrganisationByIdParams,
        @Body() body: OrganisationByIdBodyParams,
    ): Promise<void> {
        const result: void | SchulConnexError | OrganisationSpecificationError = await this.uc.setAdministriertVon(
            params.organisationId,
            body.organisationId,
        );

        if (result instanceof OrganisationSpecificationError) {
            throw result;
        }
        if (result) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(result);
        }
    }

    @Get(':organisationId/zugehoerig')
    @ApiOkResponse({
        description: 'The organizations were successfully returned.',
        type: [OrganisationResponseLegacy],
        headers: PagingHeadersObject,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get organizations.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get organizations.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all organizations.' })
    public async getZugehoerigeOrganisationen(
        @Param() params: OrganisationByIdParams,
    ): Promise<PagedResponse<OrganisationResponseLegacy>> {
        const result: Paged<OrganisationResponseLegacy> | SchulConnexError = await this.uc.findZugehoerigZu(
            params.organisationId,
        );

        if (result instanceof SchulConnexError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(result);
        }
        const response: PagedResponse<OrganisationResponseLegacy> = new PagedResponse(result);

        return response;
    }

    @Post(':organisationId/zugehoerig')
    @ApiCreatedResponse({ description: 'The organisation was successfully updated.' })
    @ApiBadRequestResponse({ description: 'The organisation could not be modified.', type: DbiamOrganisationError })
    @ApiUnauthorizedResponse({ description: 'Not authorized to modify the organisation.' })
    @ApiForbiddenResponse({ description: 'Not permitted to modify the organisation.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while modifying the organisation.' })
    public async addZugehoerigeOrganisation(
        @Param() params: OrganisationByIdParams,
        @Body() body: OrganisationByIdBodyParams,
    ): Promise<void> {
        const result: void | SchulConnexError | OrganisationSpecificationError = await this.uc.setZugehoerigZu(
            params.organisationId,
            body.organisationId,
        );

        if (result instanceof OrganisationSpecificationError) {
            throw result;
        }
        if (result) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(result);
        }
    }

    @Patch(':organisationId/name')
    @ApiOkResponse({
        description: 'The organizations were successfully updated.',
        type: OrganisationResponseLegacy,
        headers: PagingHeadersObject,
    })
    @ApiBadRequestResponse({ description: 'The organisation could not be modified.', type: DbiamOrganisationError })
    @ApiUnauthorizedResponse({ description: 'Not authorized to modify the organisation.' })
    @ApiForbiddenResponse({ description: 'Not permitted to modify the organisation.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while modifying the organisation.' })
    public async updateOrganisationName(
        @Param() params: OrganisationByIdParams,
        @Body() body: OrganisationByNameBodyParams,
    ): Promise<OrganisationResponse | DomainError> {
        const result: DomainError | Organisation<true> = await this.organisationRepository.updateKlassenname(
            params.organisationId,
            body.name,
        );

        if (result instanceof DomainError) {
            if (result instanceof OrganisationSpecificationError) {
                throw result;
            }

            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result),
            );
        }

        return new OrganisationResponse(result);
    }
}
