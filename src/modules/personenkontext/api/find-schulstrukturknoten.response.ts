import { ApiProperty } from '@nestjs/swagger';
import { OrganisationResponse } from '../../organisation/api/organisation.response.js';

export class FindSchulstrukturknotenResponse {
    @ApiProperty({ type: [OrganisationResponse] })
    public moeglicheSkks!: OrganisationResponse[];

    @ApiProperty({ type: Number })
    public total!: number;
}
