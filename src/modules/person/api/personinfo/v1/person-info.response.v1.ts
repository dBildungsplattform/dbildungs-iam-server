import { ApiProperty } from '@nestjs/swagger';
import { KontextWithOrgaAndRolle } from '../../../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { Person } from '../../../domain/person.js';
import { PersonInfoPersonResponseV1 } from './person-info-person.response.v1.js';
import { PersonInfoKontextResponseV1 } from './person-info-kontext.response.v1.js';
import { OrganisationsTyp } from '../../../../organisation/domain/organisation.enums.js';
import { PersonEmailResponse } from '../../person-email-response.js';
import { UserLock } from '../../../../keycloak-administration/domain/user-lock.js';

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
        kontexteWithOrgaAndRolle: KontextWithOrgaAndRolle[],
        email: Option<PersonEmailResponse>,
        userlocks: UserLock[],
    ): PersonInfoResponseV1 {
        const primaryKontexte: KontextWithOrgaAndRolle[] = kontexteWithOrgaAndRolle.filter(
            (kontext) => kontext.organisation.typ !== OrganisationsTyp.KLASSE,
        );
        const klassenKontexte: KontextWithOrgaAndRolle[] = kontexteWithOrgaAndRolle.filter(
            (kontext) => kontext.organisation.typ === OrganisationsTyp.KLASSE,
        );
        const personInfoKontextResponsesV1: PersonInfoKontextResponseV1[] = [];
        primaryKontexte.forEach((primaryKontext) => {
            const associatedKlassenKontexte = klassenKontexte.filter(
                (klassenKontext) => klassenKontext.organisation.administriertVon === primaryKontext.organisation.id,
            );
            personInfoKontextResponsesV1.push(
                PersonInfoKontextResponseV1.createNew(
                    primaryKontext,
                    associatedKlassenKontexte,
                    userlocks,
                    email ?? undefined,
                ),
            );
        });
        return new PersonInfoResponseV1(
            person.id,
            PersonInfoPersonResponseV1.createNew(person),
            personInfoKontextResponsesV1,
        );
    }
}
