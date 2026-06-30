import { ApiProperty } from '@nestjs/swagger';
import { KontextWithOrgaAndRolle } from '../../../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { Person } from '../../../../person/domain/person.js';
import { PersonInfoKontextResponseV2 } from './person-info-kontext.response.v2.js';
import { OrganisationsTyp } from '../../../../organisation/domain/organisation.enums.js';
import { PersonEmailResponse } from '../../../../person/api/person-email-response.js';
import { UserLock } from '../../../../keycloak-administration/domain/user-lock.js';
import { PersonInfoPersonResponseV2 } from './person-info-person.response.v2.js';

export class PersonInfoResponseV2 {
    @ApiProperty()
    public readonly pid: string;

    @ApiProperty()
    public readonly person: PersonInfoPersonResponseV2;

    @ApiProperty({ type: [PersonInfoKontextResponseV2] })
    public readonly personenkontexte: PersonInfoKontextResponseV2[];

    @ApiProperty({ type: [Object] })
    public readonly beziehungen: object[];

    protected constructor(
        pid: string,
        nestedPerson: PersonInfoPersonResponseV2,
        kontexte: PersonInfoKontextResponseV2[],
    ) {
        this.pid = pid;
        this.person = nestedPerson;
        this.personenkontexte = kontexte;
        this.beziehungen = [];
    }

    public static createNew(
        person: Person<true>,
        kontexteWithOrgaAndRolle: KontextWithOrgaAndRolle[],
        email: Option<PersonEmailResponse>,
        userlocks: UserLock[],
    ): PersonInfoResponseV2 {
        const primaryKontexte: KontextWithOrgaAndRolle[] = kontexteWithOrgaAndRolle.filter(
            (kontext: KontextWithOrgaAndRolle) => kontext.organisation.typ !== OrganisationsTyp.KLASSE,
        );
        const klassenKontexte: KontextWithOrgaAndRolle[] = kontexteWithOrgaAndRolle.filter(
            (kontext: KontextWithOrgaAndRolle) => kontext.organisation.typ === OrganisationsTyp.KLASSE,
        );
        const personInfoKontextResponsesV2: PersonInfoKontextResponseV2[] = [];
        primaryKontexte.forEach((primaryKontext: KontextWithOrgaAndRolle) => {
            const associatedKlassenKontexte: KontextWithOrgaAndRolle[] = klassenKontexte.filter(
                (klassenKontext: KontextWithOrgaAndRolle) =>
                    klassenKontext.organisation.administriertVon === primaryKontext.organisation.id,
            );
            personInfoKontextResponsesV2.push(
                PersonInfoKontextResponseV2.createNew(
                    primaryKontext,
                    associatedKlassenKontexte,
                    userlocks,
                    email ?? undefined,
                ),
            );
        });
        return new PersonInfoResponseV2(
            person.id,
            PersonInfoPersonResponseV2.createNew(person),
            personInfoKontextResponsesV2,
        );
    }
}
