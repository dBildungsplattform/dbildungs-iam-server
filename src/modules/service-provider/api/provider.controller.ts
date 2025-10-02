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
import { MissingPermissionsError } from '../../../shared/error/missing-permissions.error.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { StreamableFileFactory } from '../../../shared/util/streamable-file.factory.js';
import { AuthenticationExceptionFilter } from '../../authentication/api/authentication-exception-filter.js';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { PermittedOrgas, PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { RollenSystemRecht } from '../../rolle/domain/systemrecht.js';
import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderService } from '../domain/service-provider.service.js';
import { ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { AngebotByIdParams } from './angebot-by.id.params.js';
import { ManageableServiceProvidersParams } from './manageable-service-providers.params.js';
import { ServiceProviderResponse } from './service-provider.response.js';
import { ManageableServiceProviderListEntryResponse } from './manageable-service-provider-list-entry.response.js';

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
    @ApiOkResponse({
        description: 'The service-providers were successfully returned.',
        type: [Array<ServiceProviderResponse>],
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available service providers.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get service-providers.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all service-providers.' })
    public async getManageableServiceProviders(
        @Permissions() permissions: PersonPermissions,
        @Query() params: ManageableServiceProvidersParams,
    ): Promise<ManageableServiceProviderListEntryResponse[]> {
        const serviceProviders: ServiceProvider<true>[] = await this.serviceProviderRepo.findAuthorized(permissions, params.limit, params.offset);
        const serviceProvidersWithRollenAndErweiterungen = await this.serviceProviderService.getOrganisationRollenAndRollenerweiterungenForServiceProviders(serviceProviders);

        return serviceProvidersWithRollenAndErweiterungen.map(spWithData => new ManageableServiceProviderListEntryResponse(
            spWithData.serviceProvider,
            spWithData.organisation,
            spWithData.rollen,
            spWithData.rollenerweiterungen
        ));
    }

    @Get('manageable/:angebotId')
    @ApiOperation({ description: 'Get service-providers the logged-in user is allowed to manage.' })
    @ApiOkResponse({
        description: 'The service-providers were successfully returned.',
        type: [ServiceProviderResponse],
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available service providers.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get service-providers.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all service-providers.' })
    public async getManageableServiceProviderById(
        @Permissions() permissions: PersonPermissions,
        @Param() params: AngebotByIdParams,
    ): Promise<ServiceProviderResponse> {
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

        const permittedOrgas: PermittedOrgas = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.ANGEBOTE_VERWALTEN],
            true,
        );
        if (!(permittedOrgas.all || permittedOrgas.orgaIds.includes(serviceProvider.providedOnSchulstrukturknoten)))
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new MissingPermissionsError(`Missing ${RollenSystemRecht.ANGEBOTE_VERWALTEN.name} permission.`),
                ),
            );


        return new ServiceProviderResponse(serviceProvider);
    }
}
