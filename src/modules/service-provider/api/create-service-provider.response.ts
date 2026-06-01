import { ApiProperty, OmitType } from '@nestjs/swagger';

import { ServiceProvider } from '../domain/service-provider.js';
import { ServiceProviderResponse } from './service-provider.response.js';

export class CreateServiceProviderResponse extends OmitType(ServiceProviderResponse, ['url'] as const) {
    @ApiProperty()
    public url!: string;

    public constructor(serviceProvider: ServiceProvider<true>) {
        super(serviceProvider);
    }
}
