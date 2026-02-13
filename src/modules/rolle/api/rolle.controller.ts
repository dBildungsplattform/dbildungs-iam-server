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
    Put,
    Query,
    UseFilters,
    UseGuards,
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

import { ClassLogger } from '../../../core/logging/class-logger.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexError } from '../../../shared/error/schul-connex.error.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { Paged, PagedResponse, PagingHeadersObject } from '../../../shared/paging/index.js';
import { AuthenticationExceptionFilter } from '../../authentication/api/authentication-exception-filter.js';
import { Permissions } from '../../authentication/api/permissions.decorator.js';
import { Public } from '../../authentication/api/public.decorator.js';
import { StepUpGuard } from '../../authentication/api/steup-up.guard.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Organisation } from '../../organisation/domain/organisation.js';
import { OrganisationService } from '../../organisation/domain/organisation.service.js';
import { OrganisationRepository } from '../../organisation/persistence/organisation.repository.js';
import { DBiamPersonenkontextRepo } from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { ServiceProviderResponse } from '../../service-provider/api/service-provider.response.js';
import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { ServiceProviderRepo } from '../../service-provider/repo/service-provider.repo.js';
import { RolleDomainError } from '../domain/rolle-domain.error.js';
import { RolleFindService } from '../domain/rolle-find.service.js';
import { RolleFactory } from '../domain/rolle.factory.js';
import { Rolle } from '../domain/rolle.js';
import { RollenerweiterungFactory } from '../domain/rollenerweiterung.factory.js';
import { Rollenerweiterung } from '../domain/rollenerweiterung.js';
import { RollenSystemRecht, RollenSystemRechtEnum } from '../domain/systemrecht.js';
import { RolleRepo } from '../repo/rolle.repo.js';
import { RollenerweiterungRepo } from '../repo/rollenerweiterung.repo.js';
import { AddSystemrechtBodyParams } from './add-systemrecht.body.params.js';
import { AddSystemrechtError } from './add-systemrecht.error.js';
import { CreateRolleBodyParams } from './create-rolle.body.params.js';
import { CreateRollenerweiterungBodyParams } from './create-rollenerweiterung.body.params.js';
import { DbiamRolleError } from './dbiam-rolle.error.js';
import { FindRolleByIdParams } from './find-rolle-by-id.params.js';
import { FindRolleQueryParams } from './find-rolle-query.param.js';
import { RolleExceptionFilter } from './rolle-exception-filter.js';
import { RolleServiceProviderBodyParams } from './rolle-service-provider.body.params.js';
import { RolleServiceProviderResponse } from './rolle-service-provider.response.js';
import { RolleWithServiceProvidersResponse } from './rolle-with-serviceprovider.response.js';
import { RolleResponse } from './rolle.response.js';
import { RollenerweiterungResponse } from './rollenerweiterung.response.js';
import { SystemRechtResponse } from './systemrecht.response.js';
import { UpdateRolleBodyParams } from './update-rolle.body.params.js';

@UseFilters(new SchulConnexValidationErrorFilter(), new RolleExceptionFilter(), new AuthenticationExceptionFilter())
@ApiTags('rolle')
@ApiBearerAuth()
@ApiOAuth2(['openid'])
@Controller({ path: 'rolle' })
export class RolleController {
    public constructor(
        private readonly rolleRepo: RolleRepo,
        private readonly rolleFactory: RolleFactory,
        private readonly rolleFindService: RolleFindService,
        private readonly orgService: OrganisationService,
        private readonly serviceProviderRepo: ServiceProviderRepo,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly organisationRepository: OrganisationRepository,
        private readonly logger: ClassLogger,
        private readonly rollenerweiterungRepo: RollenerweiterungRepo,
        private readonly rollenerweiterungFactory: RollenerweiterungFactory,
    ) {}

    @Get()
    @ApiOperation({ description: 'List all rollen.' })
    @ApiOkResponse({
        description: 'The rollen were successfully returned',
        type: [RolleWithServiceProvidersResponse],
        headers: PagingHeadersObject,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get rollen.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get rollen.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all rollen.' })
    public async findRollen(
        @Query() queryParams: FindRolleQueryParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<PagedResponse<RolleWithServiceProvidersResponse>> {
        const [rollen, total]: [Rolle<true>[], number] =
            queryParams.systemrecht === RollenSystemRechtEnum.ROLLEN_ERWEITERN
                ? await this.rolleFindService.findRollenAvailableForErweiterung({
                      permissions,
                      searchStr: queryParams.searchStr,
                      organisationIds: queryParams.organisationId ? [queryParams.organisationId] : undefined,
                      rollenArten: queryParams.rollenarten,
                      limit: queryParams.limit,
                      offset: queryParams.offset,
                  })
                : await this.rolleRepo.findRollenAuthorized(
                      permissions,
                      false,
                      queryParams.searchStr,
                      queryParams.limit,
                      queryParams.offset,
                      queryParams.organisationId ? [queryParams.organisationId] : undefined,
                  );

        if (!rollen || rollen.length === 0) {
            const pagedRolleWithServiceProvidersResponse: Paged<RolleWithServiceProvidersResponse> = {
                total: 0,
                offset: 0,
                limit: queryParams.limit ?? 0,
                items: [],
            };
            return new PagedResponse(pagedRolleWithServiceProvidersResponse);
        }
        const administeredBySchulstrukturknotenIds: string[] = rollen.map(
            (r: Rolle<true>) => r.administeredBySchulstrukturknoten,
        );
        const administeredOrganisations: Map<string, Organisation<true>> = await this.organisationRepository.findByIds(
            administeredBySchulstrukturknotenIds,
        );
        const serviceProviders: ServiceProvider<true>[] = await this.serviceProviderRepo.find();
        const rollenWithServiceProvidersResponses: RolleWithServiceProvidersResponse[] = rollen.map(
            (r: Rolle<true>) => {
                const sps: ServiceProvider<true>[] = r.serviceProviderIds
                    .map((id: string) => serviceProviders.find((sp: ServiceProvider<true>) => sp.id === id))
                    .filter(Boolean);

                const administeredBySchulstrukturknoten: Organisation<true> | undefined = administeredOrganisations.get(
                    r.administeredBySchulstrukturknoten,
                );

                return new RolleWithServiceProvidersResponse(
                    r,
                    sps,
                    administeredBySchulstrukturknoten?.name,
                    administeredBySchulstrukturknoten?.kennung,
                );
            },
        );
        const pagedRolleWithServiceProvidersResponse: Paged<RolleWithServiceProvidersResponse> = {
            total: total,
            offset: queryParams.offset ?? 0,
            limit: queryParams.limit ?? rollenWithServiceProvidersResponses.length,
            items: rollenWithServiceProvidersResponses,
        };

        return new PagedResponse(pagedRolleWithServiceProvidersResponse);
    }

    @Get('systemrechte')
    @ApiOperation({ description: 'Get all systemrechte for rollen.' })
    @Public()
    @ApiOkResponse({
        description: 'Returns all systemrechte for rollen.',
        type: [SystemRechtResponse],
    })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error',
    })
    public getAllSystemrechte(): SystemRechtResponse[] {
        return RollenSystemRecht.ALL.map((systemRecht: RollenSystemRecht) => new SystemRechtResponse(systemRecht));
    }

    @Get(':rolleId')
    @ApiOperation({ description: 'Get rolle by id.' })
    @ApiOkResponse({
        description: 'The rolle was successfully returned.',
        type: RolleWithServiceProvidersResponse,
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get rolle by id.' })
    @ApiForbiddenResponse({ description: 'Insufficient permission to get rolle by id.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting rolle by id.' })
    public async findRolleByIdWithServiceProviders(
        @Param() findRolleByIdParams: FindRolleByIdParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<RolleWithServiceProvidersResponse> {
        const rolleResult: Result<Rolle<true>> = await this.rolleRepo.findByIdAuthorized(
            findRolleByIdParams.rolleId,
            permissions,
        );
        if (!rolleResult.ok) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityNotFoundError('Rolle', findRolleByIdParams.rolleId),
                ),
            );
        }

        return this.returnRolleWithServiceProvidersResponse(rolleResult.value);
    }

    @Post()
    @UseGuards(StepUpGuard)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ description: 'Create a new rolle.' })
    @ApiCreatedResponse({ description: 'The rolle was successfully created.', type: RolleResponse })
    @ApiBadRequestResponse({ description: 'The input was not valid.', type: DbiamRolleError })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create the rolle.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to create the rolle.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating the rolle.' })
    public async createRolle(
        @Body() params: CreateRolleBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<RolleResponse> {
        const orgResult: Result<Organisation<true>, DomainError> = await this.orgService.findOrganisationById(
            params.administeredBySchulstrukturknoten,
        );
        if (!orgResult.ok) {
            this.logger.error(
                `Admin: ${permissions.personFields.id}) hat versucht eine neue Rolle ${params.name} anzulegen. Fehler: ${orgResult.error.message}`,
            );
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(orgResult.error),
            );
        }
        const rolle: DomainError | Rolle<false> = this.rolleFactory.createNew(
            params.name,
            params.administeredBySchulstrukturknoten,
            params.rollenart,
            params.merkmale,
            params.systemrechte.map((s: RollenSystemRechtEnum) => RollenSystemRecht.getByName(s)),
            [],
            [],
            false,
        );

        if (rolle instanceof DomainError) {
            this.logger.error(
                `Admin: ${permissions.personFields.id}) hat versucht eine neue Rolle ${params.name} anzulegen. Fehler: ${rolle.message}`,
            );
            throw rolle;
        }
        const result: Rolle<true> | DomainError = await this.rolleRepo.save(rolle);
        if (result instanceof DomainError) {
            this.logger.error(
                `Admin: ${permissions.personFields.id}) hat versucht eine neue Rolle ${params.name} anzulegen. Fehler: ${result.message}.`,
            );
            throw result;
        }
        this.logger.info(`Admin: ${permissions.personFields.id}) hat eine neue Rolle angelegt: ${result.name}.`);

        return new RolleResponse(result);
    }

    @Patch(':rolleId')
    @UseGuards(StepUpGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ description: 'Add systemrecht to a rolle.' })
    @ApiOkResponse({ description: 'The systemrecht was successfully added to rolle.' })
    @ApiBadRequestResponse({ description: 'The input was not valid.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create the rolle.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to create the rolle.' })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error while adding systemrecht to rolle.',
    })
    public async addSystemRecht(
        @Param() findRolleByIdParams: FindRolleByIdParams,
        @Body() addSystemrechtBodyParams: AddSystemrechtBodyParams,
    ): Promise<void> {
        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(findRolleByIdParams.rolleId);
        if (rolle) {
            rolle.addSystemRecht(RollenSystemRecht.getByName(addSystemrechtBodyParams.systemRecht));
            await this.rolleRepo.save(rolle);
        } else {
            throw new AddSystemrechtError(); //hide that rolle is not found
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

    @Put(':rolleId/serviceProviders')
    @UseGuards(StepUpGuard)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ description: 'Add a service-provider to a rolle by id.' })
    @ApiOkResponse({ description: 'Adding service-provider finished successfully.', type: [ServiceProviderResponse] })
    @ApiNotFoundResponse({ description: 'The rolle or the service-provider to add does not exist.' })
    @ApiBadRequestResponse({ description: 'The service-provider is already attached to rolle.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to retrieve service-providers for rolle.' })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error, the service-provider may could not be found after attaching to rolle.',
    })
    public async updateServiceProvidersById(
        @Param() findRolleByIdParams: FindRolleByIdParams,
        @Body() spBodyParams: RolleServiceProviderBodyParams,
    ): Promise<ServiceProviderResponse[]> {
        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(findRolleByIdParams.rolleId);
        if (!rolle) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityNotFoundError('Rolle', findRolleByIdParams.rolleId),
                ),
            );
        }

        const result: void | DomainError = await rolle.updateServiceProviders(spBodyParams.serviceProviderIds);
        if (result instanceof DomainError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result),
            );
        }
        rolle.setVersionForUpdate(spBodyParams.version);
        await this.rolleRepo.save(rolle);

        const serviceProviderMap: Map<string, ServiceProvider<true>> = await this.serviceProviderRepo.findByIds(
            spBodyParams.serviceProviderIds,
        );

        // Check if all provided IDs are in the map
        const missingServiceProviderIds: string[] = spBodyParams.serviceProviderIds.filter(
            (id: string) => !serviceProviderMap.has(id),
        );

        if (missingServiceProviderIds.length > 0) {
            // If some IDs are missing, throw an error with details about the missing IDs
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                new SchulConnexError({
                    code: 500,
                    subcode: '00',
                    titel: 'Service-Provider nicht gefunden',
                    beschreibung: `Die folgenden Service-Provider-IDs konnten nicht gefunden werden: ${missingServiceProviderIds.join(', ')}`,
                }),
            );
        }
        // Convert the Map of service providers to an array of ServiceProviderResponse objects
        const serviceProviderResponses: ServiceProviderResponse[] = Array.from(serviceProviderMap.values()).map(
            (serviceProvider: ServiceProvider<true>) => new ServiceProviderResponse(serviceProvider),
        );

        // Return the array of ServiceProviderResponse objects
        return serviceProviderResponses;
    }

    @Delete(':rolleId/serviceProviders')
    @UseGuards(StepUpGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ description: 'Remove a service-provider from a rolle by id.' })
    @ApiOkResponse({ description: 'Removing service-provider finished successfully.' })
    @ApiNotFoundResponse({ description: 'The rolle or the service-provider that should be removed does not exist.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to retrieve service-providers for rolle.' })
    public async removeServiceProviderById(
        @Param() findRolleByIdParams: FindRolleByIdParams,
        @Body() spBodyParams: RolleServiceProviderBodyParams,
    ): Promise<void> {
        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(findRolleByIdParams.rolleId);

        if (!rolle) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(
                    new EntityNotFoundError('Rolle', findRolleByIdParams.rolleId),
                ),
            );
        }

        const result: void | DomainError = rolle.detatchServiceProvider(spBodyParams.serviceProviderIds);
        if (result instanceof DomainError) {
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result),
            );
        }
        rolle.setVersionForUpdate(spBodyParams.version);
        await this.rolleRepo.save(rolle);
    }

    @Put(':rolleId')
    @UseGuards(StepUpGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ description: 'Update rolle.' })
    @ApiOkResponse({
        description: 'The rolle was successfully updated.',
        type: RolleWithServiceProvidersResponse,
    })
    @ApiBadRequestResponse({ description: 'The input was not valid.', type: DbiamRolleError })
    @ApiUnauthorizedResponse({ description: 'Not authorized to update the rolle.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to update the rolle.' })
    @ApiInternalServerErrorResponse({
        description: 'Internal server error while updating the rolle.',
    })
    public async updateRolle(
        @Param() findRolleByIdParams: FindRolleByIdParams,
        @Body() params: UpdateRolleBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<RolleWithServiceProvidersResponse> {
        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(findRolleByIdParams.rolleId);
        const rolleName: string = rolle?.name ?? 'ROLLE_NOT_FOUND';

        const isAlreadyAssigned: boolean = await this.dBiamPersonenkontextRepo.isRolleAlreadyAssigned(
            findRolleByIdParams.rolleId,
        );
        const result: Rolle<true> | DomainError = await this.rolleRepo.updateRolleAuthorized(
            findRolleByIdParams.rolleId,
            params.name,
            params.merkmale,
            params.systemrechte.map((s: RollenSystemRechtEnum) => RollenSystemRecht.getByName(s)),
            params.serviceProviderIds,
            params.version,
            isAlreadyAssigned,
            permissions,
        );

        if (result instanceof DomainError) {
            if (result instanceof RolleDomainError) {
                this.logger.error(
                    `Admin: ${permissions.personFields.id}) hat versucht eine Rolle ${params.name} zu bearbeiten. Fehler: ${result.message}`,
                );
                throw result;
            }
            this.logger.error(
                `Admin: ${permissions.personFields.id}) hat versucht eine Rolle ${params.name} zu bearbeiten. Fehler: ${result.message}`,
            );
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result),
            );
        }

        this.logger.info(`Admin: ${permissions.personFields.id}) hat eine Rolle bearbeitet: ${rolleName}.`);

        return this.returnRolleWithServiceProvidersResponse(result);
    }

    @Delete(':rolleId')
    @UseGuards(StepUpGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ description: 'Delete a role by id.' })
    @ApiNoContentResponse({ description: 'Role was deleted successfully.' })
    @ApiBadRequestResponse({ description: 'The input was not valid.', type: DbiamRolleError })
    @ApiNotFoundResponse({ description: 'The rolle that should be deleted does not exist.' })
    @ApiUnauthorizedResponse({ description: 'Not authorized to delete the role.' })
    public async deleteRolle(
        @Param() findRolleByIdParams: FindRolleByIdParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<void> {
        const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(findRolleByIdParams.rolleId);
        if (!rolle) {
            const error: DomainError = new EntityNotFoundError('Rolle', findRolleByIdParams.rolleId);
            this.logger.error(
                `Admin: ${permissions.personFields.id}) hat versucht eine Rolle mit der ID ${findRolleByIdParams.rolleId} zu entfernen. Fehler: ${error.message}`,
            );
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(error),
            );
        }
        const rolleName: string = rolle.name;

        const result: Option<DomainError> = await this.rolleRepo.deleteAuthorized(
            findRolleByIdParams.rolleId,
            permissions,
        );
        if (result instanceof DomainError) {
            if (result instanceof RolleDomainError) {
                this.logger.error(
                    `Admin: ${permissions.personFields.id}) hat versucht die Rolle ${rolleName} zu entfernen. Fehler: ${result.message}`,
                );
                throw result;
            }
            this.logger.error(
                `Admin: ${permissions.personFields.id}) hat versucht die Rolle ${rolleName} zu entfernen. Fehler: ${result.message}`,
            );
            throw SchulConnexErrorMapper.mapSchulConnexErrorToHttpException(
                SchulConnexErrorMapper.mapDomainErrorToSchulConnexError(result),
            );
        }

        this.logger.info(`Admin: ${permissions.personFields.id}) hat eine Rolle entfernt: ${rolleName}.`);
    }

    @Post('erweiterung')
    @UseGuards(StepUpGuard)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ description: 'Create a new rollenerweiterung.' })
    @ApiCreatedResponse({
        description: 'The rollenerweiterung was successfully created.',
        type: RollenerweiterungResponse,
    })
    @ApiBadRequestResponse({ description: 'The input was not valid.', type: DbiamRolleError })
    @ApiUnauthorizedResponse({ description: 'Not authorized to create the rollenerweiterung.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to create the rollenerweiterung.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while creating the rollenerweiterung.' })
    public async createRollenerweiterung(
        @Body() params: CreateRollenerweiterungBodyParams,
        @Permissions() permissions: PersonPermissions,
    ): Promise<RollenerweiterungResponse> {
        const rollenerweiterung: Rollenerweiterung<false> = this.rollenerweiterungFactory.createNew(
            params.organisationId,
            params.rolleId,
            params.serviceProviderId,
        );

        const result: Result<Rollenerweiterung<true>, DomainError> = await this.rollenerweiterungRepo.createAuthorized(
            rollenerweiterung,
            permissions,
        );
        if (!result.ok) {
            this.logger.error(
                `Admin: ${permissions.personFields.id}) hat versucht eine Rolle ${params.rolleId} zu erweitern. Fehler: ${result.error.message}.`,
            );
            throw result.error;
        }
        this.logger.info(
            `Admin: ${permissions.personFields.id}) hat eine Rolle erweitert. organisationId: ${result.value.organisationId} rolleId: ${result.value.rolleId} serviceProviderId: ${result.value.serviceProviderId}.`,
        );

        return new RollenerweiterungResponse(result.value);
    }

    private async returnRolleWithServiceProvidersResponse(
        rolle: Rolle<true>,
    ): Promise<RolleWithServiceProvidersResponse> {
        const serviceProviders: ServiceProvider<true>[] = await this.serviceProviderRepo.find();

        const rolleServiceProviders: ServiceProvider<true>[] = rolle.serviceProviderIds
            .map((id: string) => serviceProviders.find((sp: ServiceProvider<true>) => sp.id === id))
            .filter(Boolean);

        return new RolleWithServiceProvidersResponse(rolle, rolleServiceProviders);
    }
}
