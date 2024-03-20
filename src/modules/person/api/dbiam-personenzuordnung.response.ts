import { ApiProperty } from '@nestjs/swagger';
import { RolleID } from '../../../shared/types/index.js';
import { OrganisationResponse } from '../../organisation/api/organisation.response.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { Rolle } from '../../rolle/domain/rolle.js';

export class DBiamPersonenzuordnungResponse {
    @ApiProperty({ type: String })
    public readonly sskId: string;

    @ApiProperty({ type: String })
    public readonly rolleId: RolleID;

    @ApiProperty({ type: String })
    public readonly sskName: string;

    @ApiProperty({ type: String })
    public readonly sskDstNr: string;

    @ApiProperty({ type: String })
    public readonly rolle: string;

    public constructor(personenkontext: Personenkontext<true>, organisation: OrganisationResponse, rolle: Rolle<true>) {
        this.sskId = personenkontext.organisationId;
        this.rolleId = personenkontext.rolleId;
        this.sskName = organisation.name;
        this.sskDstNr = organisation.kennung!;
        this.rolle = rolle.name;
    }
}
