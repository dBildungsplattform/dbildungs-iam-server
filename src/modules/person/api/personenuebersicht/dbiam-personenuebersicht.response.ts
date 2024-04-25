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

    @ApiProperty({ type: [DBiamPersonenzuordnungResponse] })
    public readonly zuordnungen: DBiamPersonenzuordnungResponse[];
    // NOTE check this example
    public constructor(person: Person<true>, personenzuordnungen: DBiamPersonenzuordnungResponse[]) {
        this.personId = person.id;
        this.vorname = person.vorname;
        this.nachname = person.familienname;
        this.benutzername = person.referrer!;
        this.zuordnungen = personenzuordnungen;
    }
}
