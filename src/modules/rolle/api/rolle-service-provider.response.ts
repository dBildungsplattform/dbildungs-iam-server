import { ApiProperty } from '@nestjs/swagger';

export class RolleServiceProviderResponse {
    @ApiProperty({ type: [String] })
    public serviceProviderIds!: string[];
}
