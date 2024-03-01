import { ApiProperty } from '@nestjs/swagger';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';

export class FindSchulstrukturknotenResponse {
    @ApiProperty({ type: [OrganisationDo<true>] })
    public moeglicheSkks!: OrganisationDo<true>[];

    @ApiProperty({ type: Number })
    public total!: number;
}
