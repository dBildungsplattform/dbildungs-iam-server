import { Body, Controller, Get } from '@nestjs/common';
import { RolleService } from '../domain/rolle.service.js';
import { ApiTags } from '@nestjs/swagger';
import { ServiceProviderDo } from '../domain/service-provider.do.js';
import { ServiceProviderByPersonIdBodyParams } from './service-provider-by-person-id.body.params.js';

@ApiTags('rolle')
@Controller({ path: 'provider' })
export class ProviderController {
    public constructor(private readonly rolleService: RolleService) {}

    @Get()
    public async getServiceProvidersByPersonId(
        @Body() params: ServiceProviderByPersonIdBodyParams,
    ): Promise<ServiceProviderDo<true>[]> {
        return this.rolleService.getAvailableServiceProviders(params.personId);
    }
}
