import { ApiProperty } from '@nestjs/swagger';

export class RollenSystemRechtServiceProviderIDResponse {
    @ApiProperty({ type: [String] })
    public systemrechte: string[];

    @ApiProperty({ type: [String] })
    public serviceProviderIds: string[];

    public constructor(systemrechte: string[], serviceProviderIds: string[]) {
        this.systemrechte = systemrechte;
        this.serviceProviderIds = serviceProviderIds;
    }
}
