/* eslint-disable max-classes-per-file */
import { ApiProperty } from '@nestjs/swagger';
import { Vertrauensstufe, VertrauensstufeTypName } from '../domain/person.enums.js';
import { PersonenkontextResponse } from '../../personenkontext/api/personenkontext.response.js';

class PersonNameResponse {
    @ApiProperty()
    public readonly familiennamen: string;

    @ApiProperty()
    public readonly vorname: string;

    @ApiProperty({ nullable: true })
    public readonly initialenfamilienname?: string;

    @ApiProperty({ nullable: true })
    public readonly initialenvorname?: string;

    @ApiProperty({ nullable: true })
    public readonly rufname?: string;

    @ApiProperty({ nullable: true })
    public readonly titel?: string;

    @ApiProperty({ type: [String], nullable: true })
    public readonly anrede?: string[];

    @ApiProperty({ type: [String], nullable: true })
    public readonly namenspraefix?: string[];

    @ApiProperty({ type: [String], nullable: true })
    public readonly namenssuffix?: string[];

    @ApiProperty({ nullable: true })
    public readonly sortierindex?: string;

    public constructor(props: Readonly<PersonNameResponse>) {
        this.familiennamen = props.familiennamen;
        this.vorname = props.vorname;
        this.initialenfamilienname = props.initialenfamilienname;
        this.initialenvorname = props.initialenvorname;
        this.rufname = props.rufname;
        this.titel = props.titel;
        this.anrede = props.anrede;
        this.namenspraefix = props.namenspraefix;
        this.namenssuffix = props.namenssuffix;
        this.sortierindex = props.sortierindex;
    }
}

class PersonBirthResponse {
    @ApiProperty({ type: Date, nullable: true })
    public readonly datum?: Date;

    @ApiProperty({ nullable: true })
    public readonly geburtsort?: string;

    public constructor(props: Readonly<PersonBirthResponse> | undefined) {
        this.datum = props?.datum;
        this.geburtsort = props?.geburtsort;
    }
}

class PersonResponse {
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

    public constructor(props: Readonly<PersonResponse>) {
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
    public readonly person: PersonResponse;

    @ApiProperty({ type: [PersonenkontextResponse] })
    public readonly personenkontexte: PersonenkontextResponse[];

    @ApiProperty({})
    public readonly gruppen: GruppeResponse[];

    public constructor(props: Readonly<PersonInfoResponse>) {
        this.pid = props.pid;
        this.person = new PersonResponse(props.person);
        this.personenkontexte = props.personenkontexte.map(
            (kontext: Readonly<PersonenkontextResponse>) => new PersonenkontextResponse(kontext),
        );
        this.gruppen = props.gruppen.map((gruppe: Readonly<GruppeResponse>) => new GruppeResponse(gruppe));
    }
}
