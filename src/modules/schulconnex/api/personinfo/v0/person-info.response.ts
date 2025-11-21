/* eslint-disable max-classes-per-file */
import { ApiProperty } from '@nestjs/swagger';
import { PersonNameResponse } from '../../../../person/api/person-name.response.js';
import { PersonEmailResponse } from '../../../../person/api/person-email-response.js';
import { Person } from '../../../../person/domain/person.js';
import { PersonenInfoKontextResponse } from './person-info-kontext.response.js';
import { KontextWithOrgaAndRolle } from '../../../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonenInfoKontextOrganisationResponse } from './person-info-kontext-organisation.response.js';
import { LoeschungResponse } from '../../../../person/api/loeschung.response.js';

export class PersonNestedInPersonInfoResponse {
    @ApiProperty()
    public readonly id: string;

    @ApiProperty({ nullable: true })
    public readonly username?: string;

    @ApiProperty()
    public readonly mandant: string;

    @ApiProperty({ type: PersonNameResponse })
    public readonly name: PersonNameResponse;

    @ApiProperty({ nullable: true })
    public readonly stammorganisation?: string;

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
        username?: string,
        stammorganisation?: string,
        personalnummer?: string,
        dienststellen?: string[],
    ) {
        this.id = id;
        this.username = username;
        this.mandant = mandant;
        this.name = new PersonNameResponse(name);
        this.stammorganisation = stammorganisation;
        this.revision = revision;
        this.personalnummer = personalnummer;
        this.dienststellen = dienststellen;
    }

    public static createNew(person: Person<true>, dienststellen: string[]): PersonNestedInPersonInfoResponse {
        return new PersonNestedInPersonInfoResponse(
            person.id,
            {
                vorname: person.vorname,
                familiennamen: person.familienname,
            } satisfies PersonNameResponse,
            person.revision,
            person.mandant,
            person.username,
            person.stammorganisation,
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

    @ApiProperty({ type: [PersonenInfoKontextResponse] })
    public readonly personenkontexte: PersonenInfoKontextResponse[];

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
        kontexte: PersonenInfoKontextResponse[],
        email: Option<PersonEmailResponse>,
        nestedPerson: PersonNestedInPersonInfoResponse,
    ) {
        this.pid = pid;
        this.person = nestedPerson;
        this.personenkontexte = kontexte;
        this.gruppen = [];
        this.email = email ? email : undefined;
    }

    public static createNew(
        person: Person<true>,
        kontexteWithOrgaAndRolle: KontextWithOrgaAndRolle[],
        email: Option<PersonEmailResponse>,
    ): PersonInfoResponse {
        const dienststellen: string[] = kontexteWithOrgaAndRolle
            .map((k: KontextWithOrgaAndRolle) => k.organisation.kennung)
            .filter((dnr: string | undefined) => dnr != null);
        const nestedPerson: PersonNestedInPersonInfoResponse = PersonNestedInPersonInfoResponse.createNew(
            person,
            dienststellen,
        );

        const kontexte: PersonenInfoKontextResponse[] = kontexteWithOrgaAndRolle.map((k: KontextWithOrgaAndRolle) => {
            return new PersonenInfoKontextResponse({
                id: k.personenkontext.id,
                username: person.username,
                mandant: person.mandant,
                organisation: PersonenInfoKontextOrganisationResponse.new({
                    id: k.organisation.id,
                    name: k.organisation.name,
                    typ: k.organisation.typ,
                    kennung: k.organisation.kennung,
                }),
                rollenart: k.rolle.rollenart,
                rollenname: k.rolle.name,
                personenstatus: k.personenkontext.personenstatus,
                jahrgangsstufe: k.personenkontext.jahrgangsstufe,
                sichtfreigabe: k.personenkontext.sichtfreigabe,
                loeschung: k.personenkontext.loeschungZeitpunkt
                    ? LoeschungResponse.new({ zeitpunkt: k.personenkontext.loeschungZeitpunkt })
                    : undefined,
                revision: k.personenkontext.revision,
            });
        });
        return new PersonInfoResponse(person.id, kontexte, email, nestedPerson);
    }
}
