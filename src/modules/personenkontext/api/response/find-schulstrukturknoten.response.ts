import { ApiProperty } from '@nestjs/swagger';
import { OrganisationResponseLegacy } from '../../../organisation/api/organisation.response.legacy.js';

export class FindSchulstrukturknotenResponse {
    public constructor(moeglicheSsks: OrganisationResponseLegacy[], total: number) {
        this.moeglicheSsks = moeglicheSsks;
        this.total = total;
    }

    @ApiProperty({ type: [OrganisationResponseLegacy] })
    public moeglicheSsks: OrganisationResponseLegacy[];

    @ApiProperty({ type: Number })
    public total: number;
}
