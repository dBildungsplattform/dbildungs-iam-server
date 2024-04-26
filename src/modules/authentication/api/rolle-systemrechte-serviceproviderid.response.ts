import { ApiProperty } from '@nestjs/swagger';

export class RollenSystemRechtServiceProviderID {
    @ApiProperty({ type: 'array', items: { type: 'string' } })
    public systemrechte: string[];

    @ApiProperty({ type: 'array', items: { type: 'string' } })
    public serviceProviderIds: string[];

    public constructor(systemrechte: string[], serviceProviderIds: string[]) {
        this.systemrechte = systemrechte;
        this.serviceProviderIds = serviceProviderIds;
    }
}
