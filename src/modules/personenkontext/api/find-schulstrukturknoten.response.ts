import { ApiProperty } from '@nestjs/swagger';
import { OrganisationResponse } from '../../organisation/api/organisation.response.js';

export class FindSchulstrukturknotenResponse {
    public constructor(moeglicheSsks: OrganisationResponse[], total: number) {
        this.moeglicheSsks = moeglicheSsks;
        this.total = total;
    }

    @ApiProperty({ type: [OrganisationResponse] })
    public moeglicheSsks: OrganisationResponse[];

    @ApiProperty({ type: Number })
    public total: number;
}
