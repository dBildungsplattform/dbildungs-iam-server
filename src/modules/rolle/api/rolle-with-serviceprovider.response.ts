import { ApiProperty } from '@nestjs/swagger';

import { ServiceProvider } from '../../service-provider/domain/service-provider.js';
import { Rolle } from '../domain/rolle.js';
import { RolleResponse } from './rolle.response.js';
import { ServiceProviderIdNameResponse } from './serviceprovider-id-name.response.js';

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
