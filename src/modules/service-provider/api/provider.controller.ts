import { Controller, Get, Param, StreamableFile, UseFilters } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { EntityNotFoundError } from '../../../shared/error/entity-not-found.error.js';
import { SchulConnexErrorMapper } from '../../../shared/error/schul-connex-error.mapper.js';
import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { AngebotByIdParams } from './angebot-by.id.params.js';
import { ServiceProviderResponse } from './service-provider.response.js';
import { AuthenticatedUser } from 'nest-keycloak-connect';
import { User } from '../../authentication/types/user.d.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { PersonPermissionsRepo } from '../../authentication/domain/person-permission.repo.js';
import { RolleRepo } from '../../rolle/repo/rolle.repo.js';
import { Rolle } from '../../rolle/domain/rolle.js';

@UseFilters(SchulConnexValidationErrorFilter)
@ApiTags('provider')
@ApiBearerAuth()
@Controller({ path: 'provider' })
export class ProviderController {
    public constructor(
        private readonly serviceProviderRepo: ServiceProviderRepo,
        private readonly personPermissionsRepo: PersonPermissionsRepo,
        private readonly rolleRepo: RolleRepo,
    ) {}

    @Get('all')
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
    @ApiOkResponse({
        description: 'The service-providers were successfully returned.',
        type: [ServiceProviderResponse],
    })
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available service providers.' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions to get service-providers.' })
    @ApiInternalServerErrorResponse({ description: 'Internal server error while getting all service-providers.' })
    public async getAvailableServiceProviders(@AuthenticatedUser() user: User): Promise<ServiceProviderResponse[]> {
        const personPermissions: PersonPermissions = await this.personPermissionsRepo.loadPersonPermissions(user.sub);
        const roleIds: string[] = await personPermissions.getRoleIds();
        const serviceProviders: ServiceProvider<true>[] = [];
        for (const roleId of roleIds) {
            const rolle: Option<Rolle<true>> = await this.rolleRepo.findById(roleId);
            if (rolle) {
                for (const serviceProviderId of rolle.serviceProviderIds) {
                    const serviceProvider: Option<ServiceProvider<true>> =
                        await this.serviceProviderRepo.findById(serviceProviderId);
                    if (serviceProvider) {
                        serviceProviders.push(serviceProvider);
                    }
                }
            }
        }
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

        const logoFile: StreamableFile = new StreamableFile(serviceProvider.logo, {
            type: serviceProvider.logoMimeType,
        });

        return logoFile;
    }
}
