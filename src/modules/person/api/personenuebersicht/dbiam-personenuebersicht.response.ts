import { ApiProperty } from '@nestjs/swagger';

import { PersonID } from '../../../../shared/types/index.js';
import { Person } from '../../domain/person.js';
import { DBiamPersonenzuordnungResponse } from './dbiam-personenzuordnung.response.js';

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

    public constructor(
        person: Person<true>,
        personenzuordnungen: DBiamPersonenzuordnungResponse[],
        lastModifiedZuordnungen?: Date,
    ) {
        this.personId = person.id;
        this.vorname = person.vorname;
        this.nachname = person.familienname;
        this.benutzername = person.username!;
        this.lastModifiedZuordnungen = lastModifiedZuordnungen;
        this.zuordnungen = personenzuordnungen;
    }
}
