import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UseFilters,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { DomainError } from '../../../shared/error/domain.error.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { OrganisationService } from '../../organisation/domain/organisation.service.js';
import { Rolle } from '../domain/rolle.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { CreateRolleBodyParams } from './create-rolle.body.params.js';
import { RolleResponse } from './rolle.response.js';
import { RolleFactory } from '../domain/rolle.factory.js';
import { AddSystemrechtBodyParams } from './add-systemrecht.body.params.js';
import { FindRolleByIdParams } from './find-rolle-by-id.params.js';
import { AddSystemrechtError } from '../../../shared/error/add-systemrecht.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { RolleServiceProviderQueryParams } from './rolle-service-provider.query.params.js';
import { RolleServiceProviderResponse } from './rolle-service-provider.response.js';

@UseFilters(SchulConnexValidationErrorFilter)
@ApiTags('rolle')
@ApiBearerAuth()
@Controller({ path: 'rolle' })
export class RolleController {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly rolleFactory: RolleFactory,
        private readonly orgService: OrganisationService,
    ) {}

    @Get()
    @ApiOperation({ description: 'List all rollen.' })
    @ApiOkResponse({ description: 'The rollen were successfully returned', type: [RolleResponse] })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get rollen.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get rollen.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all rollen.' })
    public async findRollen(): Promise<RolleResponse[]> {
        const rollen: Rolle<true>[] = await this.rolleRepo.find();

        return rollen.map((r: Rolle<true>) => new RolleResponse(r));
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ description: 'Create a new rolle.' })
    @ApiCreatedResponse({ description: 'The rolle was successfully created.', type: RolleResponse })
    @ApiBadRequestResponse({ description: 'The input was not valid.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create the rolle.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to create the rolle.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating the rolle.' })
    public async createRolle(@Body() params: CreateRolleBodyParams): Promise<RolleResponse> {
        const orgResult: Result<OrganisationDo<true>, DomainError> = await this.orgService.findOrganisationById(
            params.administeredBySchulstrukturknoten,
        );

        if (!orgResult.ok) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(orgResult.error),
            );
        }

        const rolle: Rolle<false> = this.rolleFactory.createNew(
            params.name,
            params.administeredBySchulstrukturknoten,
            params.rollenart,
            params.merkmale,
            params.systemrechte,
        );

        const result: Rolle<true> = await this.rolleRepo.save(rolle);

        return new RolleResponse(result);
    }

    @Patch(':rolleId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ description: 'Add systemrecht to a rolle.' })
    @ApiOkResponse({ description: 'The systemrecht was successfully added to rolle.' })
    @ApiBadRequestResponse({ description: 'The input was not valid.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create the rolle.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to create the rolle.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while adding systemrecht to rolle.' })
    public async addSystemRecht(
        @Param() findRolleByIdParams: FindRolleByIdParams,
        @Body() addSystemrechtBodyParams: AddSystemrechtBodyParams,
    ): Promise<void> {
        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(findRolleByIdParams.rolleId);
        if (rolle) {
            rolle.addSystemRecht(addSystemrechtBodyParams.systemRecht);
            await this.rolleRepo.save(rolle);
        } else {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new AddSystemrechtError()),
            );
        }
    }

    @Get(':rolleId/serviceProviders')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ description: 'Get service-providers for a rolle by its id.' })
    @ApiOkResponse({ description: 'Returns a list of service-provider ids.', type: RolleServiceProviderResponse })
    @ApiNotFoundResponse({ description: 'The rolle does not exist.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to retrieve service-providers for rolle.' })
    public async getRolleServiceProviderIds(
        @Param() findRolleByIdParams: FindRolleByIdParams,
    ): Promise<RolleServiceProviderResponse> {
        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(findRolleByIdParams.rolleId);
        if (!rolle) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(new EntityNotFoundError()),
            );
        }
        return {
            serviceProviderIds: rolle.serviceProviderIds,
        };
    }

    @Post(':rolleId/serviceProviders')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ description: 'Add a service-provider to a rolle by id.' })
    @ApiOkResponse({ description: 'Adding service-provider finished successfully.' })
    @ApiNotFoundResponse({ description: 'The rolle or the service-provider to add does not exist.' })
    @ApiBadRequestResponse({ description: 'The service-provider is already attached to rolle.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to retrieve service-providers for rolle.' })
    public async addServiceProviderById(
        @Param() findRolleByIdParams: FindRolleByIdParams,
        @Body() spBodyParams: RolleServiceProviderQueryParams,
    ): Promise<void> {
        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(findRolleByIdParams.rolleId);
        if (!rolle) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityNotFoundError('Rolle', findRolleByIdParams.rolleId),
                ),
            );
        }
        const result: void | DomainError = await rolle.attachServiceProvider(spBodyParams.serviceProviderId);
        if (result instanceof DomainError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result),
            );
        }
        await this.rolleRepo.save(rolle);
    }

    @Delete(':rolleId/serviceProviders')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ description: 'Remove a service-provider from a rolle by id.' })
    @ApiOkResponse({ description: 'Removing service-provider finished successfully.' })
    @ApiNotFoundResponse({ description: 'The rolle or the service-provider that should be removed does not exist.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to retrieve service-providers for rolle.' })
    public async removeServiceProviderById(
        @Param() findRolleByIdParams: FindRolleByIdParams,
        @Query() spBodyParams: RolleServiceProviderQueryParams,
    ): Promise<void> {
        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(findRolleByIdParams.rolleId);
        if (!rolle) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityNotFoundError('Rolle', findRolleByIdParams.rolleId),
                ),
            );
        }
        const result: void | DomainError = rolle.detatchServiceProvider(spBodyParams.serviceProviderId);
        if (result instanceof DomainError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result),
            );
        }
        await this.rolleRepo.save(rolle);
    }
}
