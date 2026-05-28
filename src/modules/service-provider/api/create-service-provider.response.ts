import { ApiProperty } from '@nestjs/swagger';

import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderResponse } from './service-provider.response.js';

export class CreateServiceProviderResponse extends ServiceProviderResponse {
    @ApiProperty()
    declare public url: string;

    public constructor(serviceProvider: ServiceProvider<true>) {
        super(serviceProvider);
    }
}
