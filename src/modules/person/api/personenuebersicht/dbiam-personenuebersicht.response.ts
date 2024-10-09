import { ApiProperty } from '@nestjs/swagger';

import { PersonID } from '../../../../shared/types/index.js';
import { Person } from '../../domain/person.js';
import { DBiamPersonenzuordnungResponse } from './dbiam-personenzuordnung.response.js';
import { DBiamPersonenEmailResponse } from './dbiam-personen-email.response.js';

export class DBiamPersonenuebersichtResponse {
    @ApiProperty({ type: String })
    public readonly personId: PersonID;

    @ApiProperty({ type: String })
    public readonly vorname: string;

    @ApiProperty({ type: String })
    public readonly nachname: string;

    @ApiProperty({ type: String })
    public readonly benutzername: string;

    @ApiProperty({
        nullable: true,
        type: Date,
        description: 'Date of the most recent changed personenkontext in the Zuordnungen',
    })
    public readonly lastModifiedZuordnungen?: Date;

    @ApiProperty({ type: [DBiamPersonenzuordnungResponse] })
    public readonly zuordnungen: DBiamPersonenzuordnungResponse[];

    @ApiProperty({
        type: DBiamPersonenEmailResponse,
        nullable: true,
        description:
            'Contains status and address. Returns email-address verified by OX (enabled) if available, otherwise returns most recently updated one (no prioritized status)',
    })
    public readonly email?: DBiamPersonenEmailResponse;

    public constructor(
        person: Person<true>,
        personenzuordnungen: DBiamPersonenzuordnungResponse[],
        lastModifiedZuordnungen?: Date,
        email?: DBiamPersonenEmailResponse,
    ) {
        this.personId = person.id;
        this.vorname = person.vorname;
        this.nachname = person.familienname;
        this.benutzername = person.referrer!;
        this.lastModifiedZuordnungen = lastModifiedZuordnungen;
        this.zuordnungen = personenzuordnungen;
        this.email = email;
    }
}
