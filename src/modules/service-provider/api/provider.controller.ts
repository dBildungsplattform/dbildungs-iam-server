import { Controller, Get, Param, Query, StreamableFile, UseFilters } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
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
import { ApiOkResponsePaginated, RawPagedResponse } from '../../../shared/paging/raw-paged.response.js';
import { StreamableFileFactory } from '../../../shared/util/streamable-file.factory.js';
import { AuthenticationExceptionFilter } from '../../authentication/api/authentication-exception-filter.js';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderService } from '../domain/service-provider.service.js';
import {
    ManageableServiceProviderWithReferencedObjects,
    RollenerweiterungForManageableServiceProvider,
} from '../domain/types.js';
import { ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { AngebotByIdParams } from './angebot-by.id.params.js';
import { ManageableServiceProviderListEntryResponse } from './manageable-service-provider-list-entry.response.js';
import { ManageableServiceProviderResponse } from './manageable-service-provider.response.js';
import { ManageableServiceProvidersParams } from './manageable-service-providers.params.js';
import { ServiceProviderResponse } from './service-provider.response.js';

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
        const personenkontexteIds: Pick<Personenkontext<true>, 'organisationId' | 'rolleId'>[] =
            await permissions.getPersonenkontextIds();
        const serviceProviders: ServiceProvider<true>[] =
            await this.serviceProviderService.getServiceProvidersByOrganisationenAndRollen(personenkontexteIds);
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

    @Get('manageable')
    @ApiOperation({ description: 'Get service-providers the logged-in user is allowed to manage.' })
    @ApiOkResponsePaginated(ManageableServiceProviderListEntryResponse, {
        description:
            'The service providers were successfully returned. WARNING: This endpoint returns all service providers as default when no paging parameters were set.',
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available service providers.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get service-providers.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all service-providers.' })
    public async getManageableServiceProviders(
        @Permissions() permissions: PersonPermissions,
        @Query() params: ManageableServiceProvidersParams,
    ): Promise<RawPagedResponse<ManageableServiceProviderListEntryResponse>> {
        const [serviceProviders, total]: Counted<ServiceProvider<true>> = await this.serviceProviderRepo.findAuthorized(
            permissions,
            params.limit,
            params.offset,
        );
        const serviceProvidersWithRollenAndErweiterungen: ManageableServiceProviderWithReferencedObjects[] =
            await this.serviceProviderService.getOrganisationRollenAndRollenerweiterungenForServiceProviders(
                serviceProviders,
            );

        return new RawPagedResponse({
            offset: params.offset ?? 0,
            limit: params.limit ?? total,
            total,
            items: serviceProvidersWithRollenAndErweiterungen.map(
                (spWithData: ManageableServiceProviderWithReferencedObjects) =>
                    new ManageableServiceProviderListEntryResponse(
                        spWithData.serviceProvider,
                        spWithData.organisation,
                        spWithData.rollen,
                        spWithData.rollenerweiterungen,
                    ),
            ),
        });
    }

    @Get('manageable/:angebotId')
    @ApiOperation({ description: 'Get service-provider the logged-in user is allowed to manage.' })
    @ApiOkResponse({
        description: 'The service-provider was successfully returned.',
        type: ManageableServiceProviderResponse,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available service provider.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get service-provider.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting service-provider.' })
    public async getManageableServiceProviderById(
        @Permissions() permissions: PersonPermissions,
        @Param() params: AngebotByIdParams,
    ): Promise<ManageableServiceProviderResponse> {
        const serviceProvider: Option<ServiceProvider<true>> = await this.serviceProviderRepo.findAuthorizedById(
            permissions,
            params.angebotId,
        );
        if (!serviceProvider) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityNotFoundError('ServiceProvider', params.angebotId),
                ),
            );
        }

        const serviceProviderWithOrganisationRollenAndErweiterungen: ManageableServiceProviderWithReferencedObjects = (
            await this.serviceProviderService.getOrganisationRollenAndRollenerweiterungenForServiceProviders([
                serviceProvider,
            ])
        )[0]!;

        const rollenerweiterungenWithNames: RollenerweiterungForManageableServiceProvider[] =
            await this.serviceProviderService.getRollenerweiterungenForManageableServiceProvider(
                serviceProviderWithOrganisationRollenAndErweiterungen.rollenerweiterungen,
            );

        return new ManageableServiceProviderResponse(
            serviceProviderWithOrganisationRollenAndErweiterungen.serviceProvider,
            serviceProviderWithOrganisationRollenAndErweiterungen.organisation,
            serviceProviderWithOrganisationRollenAndErweiterungen.rollen,
            rollenerweiterungenWithNames,
        );
    }
}
