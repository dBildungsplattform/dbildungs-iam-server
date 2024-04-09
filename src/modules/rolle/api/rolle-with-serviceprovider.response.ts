/* eslint-disable max-classes-per-file */
import { ApiProperty } from '@nestjs/swagger';

import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { Rolle } from '../domain/rolle.js';
import { RolleResponse } from './rolle.response.js';

class ServiceProviderIdNameResponse {
    @ApiProperty()
    public id: string;

    @ApiProperty()
    public name: string;

    public constructor(serviceProvider: ServiceProvider<true>) {
        this.id = serviceProvider.id;
        this.name = serviceProvider.name;
    }
}

export class RolleWithServiceProvidersResponse extends RolleResponse {
    @ApiProperty({ type: ServiceProviderIdNameResponse, isArray: true })
    public serviceProviders: ServiceProviderIdNameResponse[];

    public constructor(rolle: Rolle<true>, serviceProviders: ServiceProvider<true>[]) {
        super(rolle);

        this.serviceProviders = serviceProviders.map(
            (sp: ServiceProvider<true>) => new ServiceProviderIdNameResponse(sp),
        );
    }
}
