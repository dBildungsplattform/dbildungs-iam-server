import { Controller, Get, Param, StreamableFile, UseFilters } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { SchulConnexValidationErrorFilter } from '../../../shared/error/schulconnex-validation-error.filter.js';
import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderRepo } from '../repo/service-provider.repo.js';
import { AngebotByIdParams } from './angebot-by.id.params.js';
import { ServiceProviderResponse } from './service-provider.response.js';

@UseFilters(SchulConnexValidationErrorFilter)
@ApiTags('provider')
@ApiBearerAuth()
@Controller({ path: 'provider' })
export class ProviderController {
    public constructor(private readonly serviceProviderRepo: ServiceProviderRepo) {}

    @Get()
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available service providers.' })
    @ApiOkResponse({ type: [ServiceProviderResponse] })
    public async getServiceProvidersByPersonId(): Promise<ServiceProviderResponse[]> {
        const serviceProviders: ServiceProvider<true, false>[] = await this.serviceProviderRepo.find(false);

        const response: ServiceProviderResponse[] = serviceProviders.map(
            (serviceProvider: ServiceProvider<true, false>) => new ServiceProviderResponse(serviceProvider),
        );

        return response;
    }

    @Get('angebot/:angebotId/logo')
    @ApiUnauthorizedResponse({ description: 'Not authorized to get service provider logo.' })
    @ApiOkResponse({
        description: 'The logo for the service provider',
        content: { 'image/*': { schema: { type: 'file', format: 'binary' } } },
    })
    public async getServiceProviderLogo(@Param() params: AngebotByIdParams): Promise<StreamableFile> {
        const serviceProvider: Option<ServiceProvider<true, true>> = await this.serviceProviderRepo.findById(
            params.angebotId,
            true,
        );

        if (!serviceProvider) {
            throw new Error('Not found');
        }

        const logoFile: StreamableFile = new StreamableFile(serviceProvider.logo, {
            type: serviceProvider.logoMimeType,
        });

        return logoFile;
    }
}
