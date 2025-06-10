import { ApiProperty } from '@nestjs/swagger';
import { KontextWithOrgaAndRolle } from '../../../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { Person } from '../../../domain/person.js';
import { LoeschungResponse } from '../../loeschung.response.js';
import { PersonenInfoKontextOrganisationResponse } from '../person-info-kontext-organisation.response.js';
import { PersonenInfoKontextResponse } from '../person-info-kontext.response.js';
import { PersonNestedInPersonInfoResponse } from '../person-info.response.js';
import { PersonNestedInPersonInfoResponseV1 } from './person-nested-in-person-info.response.v1.js';

export class PersonInfoResponseV1 {
    @ApiProperty()
    public readonly pid: string;

    @ApiProperty()
    public readonly person: PersonNestedInPersonInfoResponseV1;

    @ApiProperty({ type: [PersonenInfoKontextResponse] })
    public readonly personenkontexte: PersonenInfoKontextResponse[];

    @ApiProperty({})
    public readonly beziehungen: object[];

    protected constructor(
        pid: string,
        kontexte: PersonenInfoKontextResponse[],
        nestedPerson: PersonNestedInPersonInfoResponse,
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
                referrer: person.referrer,
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
        return new PersonInfoResponseV1(person.id, kontexte, nestedPerson);
    }
}
