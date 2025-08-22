import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    StreamableFile,
    UseFilters,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOAuth2,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { StreamableFileFactory } from '../../../shared/util/streamable-file.factory.js';
import { AuthenticationExceptionFilter } from '../../authentication/api/authentication-exception-filter.js';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';
import { ServiceProviderFactory } from '../domain/service-provider.factory.js';
import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderService } from '../domain/service-provider.service.js';
import { ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { AngebotByIdParams } from './angebot-by.id.params.js';
import { CreateServiceProviderBodyParams } from './create-service-provider.body.params.js';
import { ServiceProviderResponse } from './service-provider.response.js';
import { UpdateServiceProviderBodyParams } from './update-service-provider.body.params.js';

@UseFilters(SchulConnexValidationErrorFilter, new AuthenticationExceptionFilter())
@ApiTags('provider')
@ApiOAuth2(['openid'])
@ApiBearerAuth()
@Controller({ path: 'provider' })
export class ProviderController {
    public constructor(
        private readonly streamableFileFactory: StreamableFileFactory,
        private readonly serviceProviderRepo: ServiceProviderRepo,
        private readonly serviceProviderService: ServiceProviderService,
        private readonly serviceProviderFactory: ServiceProviderFactory,
    ) {}

    @Get('all')
    @ApiOperation({ description: 'Get all service-providers.' })
    @ApiOkResponse({
        description: 'The service-providers were successfully returned.',
        type: [ServiceProviderResponse],
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available service providers.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get service-providers.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all service-providers.' })
    public async getAllServiceProviders(): Promise<ServiceProviderResponse[]> {
        const serviceProviders: ServiceProvider<true>[] = await this.serviceProviderRepo.find({ withLogo: false });
        const response: ServiceProviderResponse[] = serviceProviders.map(
            (serviceProvider: ServiceProvider<true>) => new ServiceProviderResponse(serviceProvider),
        );

        return response;
    }

    @Get()
    @ApiOperation({ description: 'Get service-providers available for logged-in user.' })
    @ApiOkResponse({
        description: 'The service-providers were successfully returned.',
        type: [ServiceProviderResponse],
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available service providers.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get service-providers.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all service-providers.' })
    public async getAvailableServiceProviders(
        @Permissions() permissions: PersonPermissions,
    ): Promise<ServiceProviderResponse[]> {
        const roleIds: string[] = await permissions.getRoleIds();
        const serviceProviders: ServiceProvider<true>[] =
            await this.serviceProviderService.getServiceProvidersByRolleIds(roleIds);

        return serviceProviders.map(
            (serviceProvider: ServiceProvider<true>) => new ServiceProviderResponse(serviceProvider),
        );
    }

    @Get(':angebotId/logo')
    @ApiOkResponse({
        description: 'The logo for the service provider was successfully returned.',
        content: { 'image/*': { schema: { type: 'file', format: 'binary' } } },
    })
    @ApiBadRequestResponse({ description: 'Angebot ID is required.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get service provider logo.' })
    @ApiNotFoundResponse({ description: 'The service-provider does not exist or has no logo.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get the logo.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting the logo.' })
    public async getServiceProviderLogo(@Param() params: AngebotByIdParams): Promise<StreamableFile> {
        const serviceProvider: Option<ServiceProvider<true>> = await this.serviceProviderRepo.findById(
            params.angebotId,
            { withLogo: true },
        );

        if (!serviceProvider) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityNotFoundError('ServiceProvider', params.angebotId),
                ),
            );
        }

        if (!serviceProvider.logo || !serviceProvider.logoMimeType) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityNotFoundError('ServiceProviderLogo', params.angebotId),
                ),
            );
        }

        const logoFile: StreamableFile = this.streamableFileFactory.fromBuffer(serviceProvider.logo, {
            type: serviceProvider.logoMimeType,
        });

        return logoFile;
    }

    @Post()
    @ApiOperation({ description: 'Create a new service-provider.' })
    @ApiCreatedResponse({
        description: 'The service-provider was added successfully.',
        type: ServiceProviderResponse,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create new service provider.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to create a new service-provider.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating a new service-provider.' })
    public async createNewServiceProvider(
        @Body() spBodyParams: CreateServiceProviderBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<ServiceProviderResponse> {
        if (!(await permissions.hasSystemrechteAtRootOrganisation([RollenSystemRecht.SERVICEPROVIDER_VERWALTEN]))) {
            throw new ForbiddenException('You do not have the required permissions to create new service provider.');
        }

        const newServiceProvider: ServiceProvider<false> = this.serviceProviderFactory.createNew(
            spBodyParams.name,
            spBodyParams.target,
            spBodyParams.url,
            spBodyParams.kategorie,
            spBodyParams.providedOnSchulstrukturknoten,
            spBodyParams.logo ? Buffer.from(spBodyParams.logo, 'base64') : undefined,
            spBodyParams.logoMimeType,
            spBodyParams.keycloakGroup,
            spBodyParams.keycloakRole,
            spBodyParams.externalSystem,
            spBodyParams.requires2fa,
            spBodyParams.vidisAngebotId,
        );
        const savedServiceProvider: ServiceProvider<true> = await this.serviceProviderRepo.save(newServiceProvider);
        const response: ServiceProviderResponse = new ServiceProviderResponse(savedServiceProvider);

        return response;
    }

    @Patch(':angebotId')
    @ApiOperation({ description: 'Update an existing service-provider.' })
    @ApiOkResponse({
        description: 'The service-provider was updated successfully.',
        type: ServiceProviderResponse,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to update the service provider.' })
    @ApiNotFoundResponse({ description: 'The service-provider with the given id was not found' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to update the service-provider.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while updating the service-provider.' })
    public async updateServiceProvider(
        @Param() params: AngebotByIdParams,
        @Body() spBodyParams: UpdateServiceProviderBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<ServiceProviderResponse> {
        if (!(await permissions.hasSystemrechteAtRootOrganisation([RollenSystemRecht.SERVICEPROVIDER_VERWALTEN]))) {
            throw new ForbiddenException('You do not have the required permissions to update a service provider.');
        }

        const serviceProvider: Option<ServiceProvider<true>> = await this.serviceProviderRepo.findById(
            params.angebotId,
        );

        if (!serviceProvider) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityNotFoundError('ServiceProvider', params.angebotId),
                ),
            );
        }

        const updatedServiceProvider: ServiceProvider<true> = this.serviceProviderFactory.construct(
            serviceProvider.id,
            serviceProvider.createdAt,
            serviceProvider.updatedAt,
            spBodyParams.name || serviceProvider.name,
            spBodyParams.target || serviceProvider.target,
            spBodyParams.url || serviceProvider.url,
            spBodyParams.kategorie || serviceProvider.kategorie,
            spBodyParams.providedOnSchulstrukturknoten || serviceProvider.providedOnSchulstrukturknoten,
            spBodyParams.logo ? Buffer.from(spBodyParams.logo, 'base64') : serviceProvider.logo,
            spBodyParams.logoMimeType || serviceProvider.logoMimeType,
            spBodyParams.keycloakGroup || serviceProvider.keycloakGroup,
            spBodyParams.keycloakRole || serviceProvider.keycloakRole,
            spBodyParams.externalSystem || serviceProvider.externalSystem,
            spBodyParams.requires2fa || serviceProvider.requires2fa,
            spBodyParams.vidisAngebotId || serviceProvider.vidisAngebotId,
        );
        const savedServiceProvider: ServiceProvider<true> = await this.serviceProviderRepo.save(updatedServiceProvider);
        const response: ServiceProviderResponse = new ServiceProviderResponse(savedServiceProvider);

        return response;
    }

    @Delete(':angebotId')
    @ApiOperation({ description: 'Delete an existing service-provider.' })
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({
        description: 'The service-provider was deleted successfully.',
        type: ServiceProviderResponse,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to delete the service provider.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to delete the service-provider.' })
    @ApiNotFoundResponse({ description: 'The service-provider with the given id was not found' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while updating the service-provider.' })
    public async deleteServiceProvider(
        @Param() params: AngebotByIdParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<void> {
        if (!(await permissions.hasSystemrechteAtRootOrganisation([RollenSystemRecht.SERVICEPROVIDER_VERWALTEN]))) {
            throw new ForbiddenException('You do not have the required permissions to delete a service provider.');
        }

        const deleted: boolean = await this.serviceProviderRepo.deleteById(params.angebotId);
        if (!deleted) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityNotFoundError('ServiceProvider', params.angebotId),
                ),
            );
        }
    }
}
