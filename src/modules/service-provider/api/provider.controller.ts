import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    StreamableFile,
    UnauthorizedException,
    UseFilters,
} from '@nestjs/common';
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
import { PermittedOrgas, PersonPermissions } from '../../authentication/domain/person-permissions.js';
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
import { RollenerweiterungByServiceProvidersIdPathParams } from './rollenerweiterung-by-service-provider-id.pathparams.js';
import { RollenerweiterungRepo } from '../../rolle/repo/rollenerweiterung.repo.js';
import { Rollenerweiterung } from '../../rolle/domain/rollenerweiterung.js';
import { RollenSystemRecht } from '../../rolle/domain/systemrecht.js';
import { RollenerweiterungByServiceProvidersIdQueryParams } from './rollenerweiterung-by-service-provider-id.queryparams.js';
import { RollenerweiterungWithExtendedDataResponse } from '../../rolle/api/rollenerweiterung-with-extended-data.response.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { OrganisationID, RolleID } from '../../../shared/types/index.js';
import { uniq } from 'lodash-es';
import { Rolle } from '../../rolle/domain/rolle.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { ManageableServiceProvidersForOrganisationParams } from './manageable-service-providers-for-organisation.params.js';
import { MissingPermissionsError } from '../../../shared/error/index.js';
import { CreateServiceProviderBodyParams } from './create-service-provider-body.params.js';
import { ServiceProviderFactory } from '../domain/service-provider.factory.js';
import { ServiceProviderSystem } from '../domain/service-provider.enum.js';

@UseFilters(SchulConnexValidationErrorFilter, new AuthenticationExceptionFilter())
@ApiTags('provider')
@ApiOAuth2(['openid'])
@ApiBearerAuth()
@Controller({ path: 'provider' })
export class ProviderController {
    public constructor(
        private readonly streamableFileFactory: StreamableFileFactory,
        private readonly serviceProviderFactory: ServiceProviderFactory,
        private readonly serviceProviderRepo: ServiceProviderRepo,
        private readonly serviceProviderService: ServiceProviderService,
        private readonly rollenerweiterungRepo: RollenerweiterungRepo,
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepo: OrganisationRepository,
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

    @Get(':angebotId/rollenerweiterung')
    @ApiOperation({ description: 'Get rollenerweiterungen for service-provider with provided id.' })
    @ApiOkResponsePaginated(RollenerweiterungWithExtendedDataResponse, {
        description:
            'The rollenerweiterungen were successfully returned. WARNING: This endpoint returns all rollenerweiterungen of the service-provider as default when no paging parameters were set.',
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get rollenerweiterungen.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get rollenerweiterungen.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting rollenerweiterungen.' })
    public async findRollenerweiterungenByServiceProviderId(
        @Permissions() permissions: PersonPermissions,
        @Param() pathParams: RollenerweiterungByServiceProvidersIdPathParams,
        @Query() queryParams: RollenerweiterungByServiceProvidersIdQueryParams,
    ): Promise<RawPagedResponse<RollenerweiterungWithExtendedDataResponse>> {
        const permittedOrgas: PermittedOrgas = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.ROLLEN_ERWEITERN, RollenSystemRecht.ANGEBOTE_VERWALTEN],
            false,
            true,
        );
        if (!permittedOrgas.all && permittedOrgas.orgaIds.length === 0) {
            throw new UnauthorizedException('NOT_AUTHORIZED');
        }

        const [rollenerweiterungen, total]: Counted<Rollenerweiterung<true>> =
            await this.rollenerweiterungRepo.findByServiceProviderIdPagedAndSortedByOrgaKennung(
                pathParams.angebotId,
                permittedOrgas.all ? undefined : permittedOrgas.orgaIds,
                queryParams.offset,
                queryParams.limit,
            );

        const rolleIds: RolleID[] = uniq(rollenerweiterungen.map((re: Rollenerweiterung<true>) => re.rolleId));
        const organisationIds: OrganisationID[] = uniq(
            rollenerweiterungen.map((re: Rollenerweiterung<true>) => re.organisationId),
        );

        const [rollen, organisationen]: [Map<RolleID, Rolle<true>>, Map<OrganisationID, Organisation<true>>] =
            await Promise.all([this.rolleRepo.findByIds(rolleIds), this.organisationRepo.findByIds(organisationIds)]);

        /* The data is passed as option<> instead of mandatory with error checking,
        because otherwise a single faulty relation in an extension
        could cause all other extensions to fail to load */
        const rollenerweiterungResponses: RollenerweiterungWithExtendedDataResponse[] = rollenerweiterungen.map(
            (re: Rollenerweiterung<true>) =>
                new RollenerweiterungWithExtendedDataResponse(
                    re,
                    rollen.get(re.rolleId),
                    organisationen.get(re.organisationId),
                ),
        );

        return new RawPagedResponse({
            offset: queryParams.offset ?? 0,
            limit: queryParams.limit ?? total,
            total,
            items: rollenerweiterungResponses,
        });
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
                1,
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

    @Get('manageable-by-organisation')
    @ApiOperation({ description: 'Get service-providers the logged-in user is allowed to manage for an Organisation.' })
    @ApiOkResponsePaginated(ManageableServiceProviderListEntryResponse, {
        description:
            'The service providers were successfully returned. WARNING: This endpoint returns all service providers as default when no paging parameters were set.',
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available service providers.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get service-providers.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all service-providers.' })
    public async getManageableServiceProvidersForOrganisationId(
        @Permissions() permissions: PersonPermissions,
        @Query() params: ManageableServiceProvidersForOrganisationParams,
    ): Promise<RawPagedResponse<ManageableServiceProviderListEntryResponse>> {
        const result: Result<
            Counted<ServiceProvider<true>>,
            MissingPermissionsError
        > = await this.serviceProviderService.getAuthorizedForRollenErweiternWithMerkmalRollenerweiterung(
            params.organisationId,
            permissions,
            params.limit,
            params.offset,
        );

        if (!result.ok) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new MissingPermissionsError('Rollen Erweitern Systemrecht Required For This Endpoint'),
                ),
            );
        }

        const serviceProviders: ServiceProvider<true>[] = result.value[0];
        const total: number = result.value[1];

        const serviceProvidersWithRollenAndErweiterungen: ManageableServiceProviderWithReferencedObjects[] =
            await this.serviceProviderService.getOrganisationRollenAndRollenerweiterungenForServiceProviders(
                serviceProviders,
                5,
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
            rollenerweiterungenWithNames.length > 0,
        );
    }

    @Post()
    @ApiOperation({ description: 'Create a new service-provider (Angebot).' })
    @ApiOkResponse({
        description: 'The service-provider was successfully created.',
        type: ServiceProviderResponse,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions.' })
    @ApiBadRequestResponse({ description: 'Invalid request body.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
    public async createServiceProvider(
        @Permissions() permissions: PersonPermissions,
        @Body() body: CreateServiceProviderBodyParams,
    ): Promise<ServiceProviderResponse> {
        if (
            !(await permissions.hasSystemrechtAtOrganisation(body.organisationId, RollenSystemRecht.ANGEBOTE_VERWALTEN))
        ) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new MissingPermissionsError('Not authorized to manage Service Providers at this organisation!'),
                ),
            );
        }

        // Convert base64 to Buffer (if provided)
        const logoBuffer: Buffer | undefined = body.logoBase64 ? Buffer.from(body.logoBase64, 'base64') : undefined;

        const serviceProvider: ServiceProvider<false> = this.serviceProviderFactory.createNew(
            body.name,
            body.target,
            body.url,
            body.kategorie,
            body.organisationId,
            logoBuffer,
            body.logoMimeType,
            undefined, // keycloakGroup
            undefined, // keycloakRole
            ServiceProviderSystem.NONE,
            body.requires2fa,
            body.vidisAngebotId,
            body.merkmale,
        );

        const result: ServiceProvider<true> = await this.serviceProviderRepo.save(serviceProvider);

        return new ServiceProviderResponse(result);
    }
}
