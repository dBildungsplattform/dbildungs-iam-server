import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { ServiceProviderResponse } from './service-provider.response.js';

@ApiTags('provider')
@ApiBearerAuth()
@Controller({ path: 'provider' })
export class ProviderController {
    @Get()
    @ApiUnauthorizedResponse({ description: 'Not authorized to get available service providers.' })
    @ApiOkResponse({ type: [ServiceProviderResponse] })
    public getServiceProvidersByPersonId(): ServiceProviderResponse[] {
        const providers: ServiceProviderResponse[] = plainToInstance(ServiceProviderResponse, [
            {
                id: '8f448f82-0be3-4d82-9cb1-2e67f277796f',
                name: 'Email',
                url: 'https://de.wikipedia.org/wiki/E-Mail',
            },
            {
                id: 'ecc794a3-f94f-40f6-bef6-bd4808cf64d4',
                name: 'ItsLearning',
                url: 'https://itslearning.com/de',
            },
        ]);

        return providers;
    }
}
