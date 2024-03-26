import { ApiProperty } from '@nestjs/swagger';
import { OrganisationResponse } from '../../organisation/api/organisation.response.js';

export class FindSchulstrukturknotenResponse {
    public constructor(moeglicheSkks: OrganisationResponse[], total: number) {
        this.moeglicheSkks = moeglicheSkks;
        this.total = total;
    }

    @ApiProperty({ type: [OrganisationResponse] })
    public moeglicheSkks: OrganisationResponse[];

    @ApiProperty({ type: Number })
    public total: number;
}
