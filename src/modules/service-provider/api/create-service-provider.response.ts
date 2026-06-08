import { ApiProperty } from '@nestjs/swagger';

import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderResponse } from './service-provider.response.js';

export class CreateServiceProviderResponse extends ServiceProviderResponse {
    @ApiProperty({
        required: true,
        description: 'URL of created service provider',
    })
    public override url: string;

    public constructor(serviceProvider: ServiceProvider<true>) {
        super(serviceProvider);
        this.url = serviceProvider.url as string;
    }
}
