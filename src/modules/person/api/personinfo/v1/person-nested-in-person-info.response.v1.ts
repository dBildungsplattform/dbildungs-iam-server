import { ApiProperty } from '@nestjs/swagger';
import { Person } from '../../../domain/person.js';
import { Vertrauensstufe, VertrauensstufeTypName } from '../../../domain/person.enums.js';
import { PersonNameResponseV1 } from './person-name.response.v1.js';
import { PersonGeburtResponseV1 } from './person-geburt.response.v1.js';

export class PersonNestedInPersonInfoResponseV1 {
    @ApiProperty()
    public readonly stammorganisation?: object;

    @ApiProperty({ type: PersonNameResponseV1 })
    public readonly name: PersonNameResponseV1;

    @ApiProperty({ type: PersonGeburtResponseV1 })
    public readonly geburt?: PersonGeburtResponseV1;

    @ApiProperty({ nullable: true })
    public readonly geschlecht?: string;

    @ApiProperty({ nullable: true })
    public readonly lokalisierung?: string;

    @ApiProperty({ enum: Vertrauensstufe, enumName: VertrauensstufeTypName, nullable: true })
    public readonly vertrauensstufe?: Vertrauensstufe;

    protected constructor(
        name: PersonNameResponseV1,
        geburt?: PersonGeburtResponseV1,
        geschlecht?: string,
        lokalisierung?: string,
        vertrauensstufe?: Vertrauensstufe,
    ) {
        this.name = new PersonNameResponseV1(name);
        this.geburt = geburt ? new PersonGeburtResponseV1(geburt) : undefined;
        this.geschlecht = geschlecht;
        this.lokalisierung = lokalisierung;
        this.vertrauensstufe = vertrauensstufe;
    }

    public static createNew(person: Person<true>): PersonNestedInPersonInfoResponseV1 {
        return new PersonNestedInPersonInfoResponseV1(
            {
                vorname: person.vorname,
                familiennamen: person.familienname,
            } satisfies PersonNameResponseV1,
            undefined,
            undefined,
            undefined,
            undefined,
        );
    }
}
