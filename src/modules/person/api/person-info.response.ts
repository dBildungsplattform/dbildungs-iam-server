/* eslint-disable max-classes-per-file */
import { ApiProperty } from '@nestjs/swagger';
import { Vertrauensstufe, VertrauensstufeTypName } from '../domain/person.enums.js';
import { PersonenkontextResponse } from '../../personenkontext/api/personenkontext.response.js';
import { PersonNameResponse } from './person-name.response.js';
import { PersonBirthResponse } from './person-birth.response.js';

class Person {
    @ApiProperty()
    public readonly id: string;

    @ApiProperty({ nullable: true })
    public readonly referrer?: string;

    @ApiProperty()
    public readonly mandant: string;

    @ApiProperty({ type: PersonNameResponse })
    public readonly name: PersonNameResponse;

    @ApiProperty({ type: PersonBirthResponse, nullable: true })
    public readonly geburt?: PersonBirthResponse;

    @ApiProperty({ nullable: true })
    public readonly stammorganisation?: string;

    @ApiProperty({ nullable: true })
    public readonly geschlecht?: string;

    @ApiProperty({ nullable: true })
    public readonly lokalisierung?: string;

    @ApiProperty({ enum: Vertrauensstufe, enumName: VertrauensstufeTypName, nullable: true })
    public readonly vertrauensstufe?: Vertrauensstufe;

    @ApiProperty()
    public readonly revision: string;

    public constructor(props: Readonly<Person>) {
        this.id = props.id;
        this.referrer = props.referrer;
        this.mandant = props.mandant;
        this.name = new PersonNameResponse(props.name);
        this.geburt = new PersonBirthResponse(props.geburt);
        this.stammorganisation = props.stammorganisation;
        this.geschlecht = props.geschlecht;
        this.lokalisierung = props.lokalisierung;
        this.vertrauensstufe = props.vertrauensstufe;
        this.revision = props.revision;
    }
}

class GruppeResponse {
    // This is a dummy class to make the code compile

    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    public constructor(_props: Readonly<GruppeResponse>) {
        // This is a dummy constructor to make the code compile
    }
}

export class PersonInfoResponse {
    @ApiProperty()
    public readonly pid: string;

    @ApiProperty()
    public readonly person: Person;

    @ApiProperty({ type: [PersonenkontextResponse] })
    public readonly personenkontexte: PersonenkontextResponse[];

    @ApiProperty({})
    public readonly gruppen: GruppeResponse[];

    public constructor(props: Readonly<PersonInfoResponse>) {
        this.pid = props.pid;
        this.person = new Person(props.person);
        this.personenkontexte = props.personenkontexte.map((kontext: Readonly<PersonenkontextResponse>) =>
            PersonenkontextResponse.new(kontext),
        );
        this.gruppen = props.gruppen.map((gruppe: Readonly<GruppeResponse>) => new GruppeResponse(gruppe));
    }
}
