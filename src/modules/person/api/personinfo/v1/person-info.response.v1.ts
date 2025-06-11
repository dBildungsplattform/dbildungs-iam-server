import { ApiProperty } from '@nestjs/swagger';
import { KontextWithOrgaAndRolle } from '../../../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { Person } from '../../../domain/person.js';
import { PersonInfoPersonResponseV1 } from './person-info-person.response.v1.js';
import { PersonInfoKontextResponseV1 } from './person-info-kontext.response.v1.js';

export class PersonInfoResponseV1 {
    @ApiProperty()
    public readonly pid: string;

    @ApiProperty()
    public readonly person: PersonInfoPersonResponseV1;

    @ApiProperty({ type: [PersonInfoKontextResponseV1] })
    public readonly personenkontexte: PersonInfoKontextResponseV1[];

    @ApiProperty({})
    public readonly beziehungen: object[];

    protected constructor(
        pid: string,
        nestedPerson: PersonInfoPersonResponseV1,
        kontexte: PersonInfoKontextResponseV1[],
    ) {
        this.pid = pid;
        this.person = nestedPerson;
        this.personenkontexte = kontexte;
        this.beziehungen = [];
    }

    public static createNew(
        person: Person<true>,
        kontexteWithOrgaAndRolle: KontextWithOrgaAndRolle[]
    ): PersonInfoResponseV1 {
        const personInfoPersonResponseV1 = PersonInfoPersonResponseV1.createNew(person);
        return new PersonInfoResponseV1(person.id, personInfoPersonResponseV1, kontexte);
    }
}
