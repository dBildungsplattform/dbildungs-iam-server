import { ApiProperty } from '@nestjs/swagger';

import { OrganisationID, PersonID, RolleID } from '../../../../shared/types/index.js';
import { Personenkontext } from '../../domain/personenkontext.js';

export class DBiamPersonenkontextResponse {
    @ApiProperty({ type: String })
    public readonly personId: PersonID;

    @ApiProperty({ type: String })
    public readonly organisationId: OrganisationID;

    @ApiProperty({ type: String })
    public readonly rolleId: RolleID;

    @ApiProperty({ type: String })
    public readonly befristung?: Date;

    public constructor(personenkontext: Personenkontext<true>) {
        this.personId = personenkontext.personId;
        this.organisationId = personenkontext.organisationId;
        this.rolleId = personenkontext.rolleId;
        this.befristung = personenkontext.befristung;
    }
}
