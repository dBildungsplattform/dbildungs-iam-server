import { ApiProperty } from '@nestjs/swagger';
import { Person } from '../../../domain/person.js';
import { Vertrauensstufe, VertrauensstufeTypName } from '../../../domain/person.enums.js';
import { PersonInfoPersonNameResponseV1 } from './person-info-person-name.response.v1.js';
import { PersonInfoGeburtResponseV1 } from './person-info-geburt.response.v1.js';

export class PersonInfoPersonResponseV1 {
    @ApiProperty()
    public readonly stammorganisation?: object;

    @ApiProperty({ type: PersonInfoPersonNameResponseV1 })
    public readonly name: PersonInfoPersonNameResponseV1;

    @ApiProperty({ type: PersonInfoGeburtResponseV1 })
    public readonly geburt?: PersonInfoGeburtResponseV1;

    @ApiProperty({ nullable: true })
    public readonly geschlecht?: string;

    @ApiProperty({ nullable: true })
    public readonly lokalisierung?: string;

    @ApiProperty({ enum: Vertrauensstufe, enumName: VertrauensstufeTypName, nullable: true })
    public readonly vertrauensstufe?: Vertrauensstufe;

    protected constructor(
        name: PersonInfoPersonNameResponseV1,
        geburt?: PersonInfoGeburtResponseV1,
        geschlecht?: string,
        lokalisierung?: string,
        vertrauensstufe?: Vertrauensstufe,
    ) {
        this.name = new PersonInfoPersonNameResponseV1(name);
        this.geburt = geburt ? new PersonInfoGeburtResponseV1(geburt) : undefined;
        this.geschlecht = geschlecht;
        this.lokalisierung = lokalisierung;
        this.vertrauensstufe = vertrauensstufe;
    }

    public static createNew(person: Person<true>): PersonInfoPersonResponseV1 {
        return new PersonInfoPersonResponseV1(
            {
                vorname: person.vorname,
                familiennamen: person.familienname,
            } satisfies PersonInfoPersonNameResponseV1,
            undefined,
            undefined,
            undefined,
            undefined,
        );
    }
}
