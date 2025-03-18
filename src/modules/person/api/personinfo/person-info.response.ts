/* eslint-disable max-classes-per-file */
import { ApiProperty } from '@nestjs/swagger';
import { Vertrauensstufe, VertrauensstufeTypName } from '../../domain/person.enums.js';
import { PersonenkontextResponse } from '../../../personenkontext/api/response/personenkontext.response.js';
import { PersonNameResponse } from '../person-name.response.js';
import { PersonBirthResponse } from '../person-birth.response.js';
import { PersonEmailResponse } from '../person-email-response.js';
import { Person } from '../../domain/person.js';

export class PersonNestedInPersonInfoResponse {
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

    @ApiProperty({ nullable: true })
    public readonly personalnummer?: string;

    @ApiProperty({ nullable: true })
    public readonly dienststellen?: string[];

    protected constructor(
        id: string,
        name: PersonNameResponse,
        revision: string,
        mandant: string,
        referrer?: string,
        geburt?: PersonBirthResponse,
        stammorganisation?: string,
        geschlecht?: string,
        lokalisierung?: string,
        vertrauensstufe?: Vertrauensstufe,
        personalnummer?: string,
        dienststellen?: string[],
    ) {
        this.id = id;
        this.referrer = referrer;
        this.mandant = mandant;
        this.name = new PersonNameResponse(name);
        this.geburt = new PersonBirthResponse(geburt);
        this.stammorganisation = stammorganisation;
        this.geschlecht = geschlecht;
        this.lokalisierung = lokalisierung;
        this.vertrauensstufe = vertrauensstufe;
        this.revision = revision;
        this.personalnummer = personalnummer;
        this.dienststellen = dienststellen;
    }

    public static createNew(person: Person<true>, dienststellen: string[]): PersonNestedInPersonInfoResponse {
        return new PersonNestedInPersonInfoResponse(
            person.id,
            {
                titel: person.nameTitel,
                anrede: person.nameAnrede,
                vorname: person.vorname,
                familiennamen: person.familienname,
                initialenfamilienname: person.initialenFamilienname,
                initialenvorname: person.initialenVorname,
                rufname: person.rufname,
                namenspraefix: person.namePraefix,
                namenssuffix: person.nameSuffix,
                sortierindex: person.nameSortierindex,
            } satisfies PersonNameResponse,
            person.revision,
            person.mandant,
            person.referrer,
            {
                datum: person.geburtsdatum,
                geburtsort: person.geburtsort,
            } satisfies PersonBirthResponse,
            person.stammorganisation,
            person.geschlecht,
            person.lokalisierung,
            person.vertrauensstufe,
            person.personalnummer,
            dienststellen,
        );
    }
}

export class PersonInfoResponse {
    @ApiProperty()
    public readonly pid: string;

    @ApiProperty()
    public readonly person: PersonNestedInPersonInfoResponse;

    @ApiProperty({ type: [PersonenkontextResponse] })
    public readonly personenkontexte: PersonenkontextResponse[];

    @ApiProperty({})
    public readonly gruppen: object[];

    @ApiProperty({
        type: PersonEmailResponse,
        nullable: true,
        description:
            'Contains status and address. Returns email-address verified by OX (enabled) if available, otherwise returns most recently updated one (no prioritized status)',
    })
    public readonly email?: PersonEmailResponse;

    protected constructor(
        pid: string,
        kontexte: PersonenkontextResponse[],
        email: PersonEmailResponse | undefined,
        nestedPerson: PersonNestedInPersonInfoResponse,
    ) {
        this.pid = pid;
        this.person = nestedPerson;
        this.personenkontexte = kontexte;
        this.gruppen = [];
        this.email = email;
    }

    public static createNew(
        person: Person<true>,
        kontexte: PersonenkontextResponse[],
        dienststellen: string[],
        email: PersonEmailResponse | undefined,
    ): PersonInfoResponse {
        const nestedPerson: PersonNestedInPersonInfoResponse = PersonNestedInPersonInfoResponse.createNew(
            person,
            dienststellen,
        );
        return new PersonInfoResponse(person.id, kontexte, email, nestedPerson);
    }
}
