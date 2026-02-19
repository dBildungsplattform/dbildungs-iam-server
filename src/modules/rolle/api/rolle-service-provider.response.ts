import { ApiProperty } from '@nestjs/swagger';

export class RolleServiceProviderResponse {
    public constructor(serviceProviderIds: string[]) {
        this.serviceProviderIds = serviceProviderIds;
    }

    @ApiProperty({ type: [String] })
    public serviceProviderIds: string[];
}
