import { ApiProperty } from '@nestjs/swagger';
import { Person } from '../../../../person/domain/person.js';
import { PersonInfoPersonNameResponseV1 } from './person-info-person-name.response.v1.js';

export class PersonInfoPersonResponseV1 {
    @ApiProperty({ nullable: true })
    public readonly stammorganisation?: object;

    @ApiProperty({ type: PersonInfoPersonNameResponseV1 })
    public readonly name: PersonInfoPersonNameResponseV1;

    protected constructor(name: PersonInfoPersonNameResponseV1) {
        this.name = new PersonInfoPersonNameResponseV1(name);
    }

    public static createNew(person: Person<true>): PersonInfoPersonResponseV1 {
        return new PersonInfoPersonResponseV1({
            vorname: person.vorname,
            familiennamen: person.familienname,
        } satisfies PersonInfoPersonNameResponseV1);
    }
}
