import { ApiProperty } from '@nestjs/swagger';
import { PersonenInfoKontextOrganisationResponseV1 } from './person-info-kontext-organisation.response.v1';
import { PersonInfoKontextErreichbarkeitResponseV1 } from './person-info-kontext-erreichbarkeit.response.v1 copy';
import { KontextWithOrgaAndRolle } from '../../../../personenkontext/persistence/dbiam-personenkontext.repo';
import { Person } from '../../../domain/person';
import { PersonEmailResponse } from '../../person-email-response';
import { EmailAddressStatus } from '../../../../email/domain/email-address';
import { OrganisationsTyp } from '../../../../organisation/domain/organisation.enums';

export class PersonInfoKontextResponseV1 {
    @ApiProperty()
    public id!: string;

    @ApiProperty({ type: PersonenInfoKontextOrganisationResponseV1 })
    public organisation!: PersonenInfoKontextOrganisationResponseV1;

    @ApiProperty()
    public rolle!: string;

    @ApiProperty({ type: [PersonInfoKontextErreichbarkeitResponseV1] })
    public erreichbarkeiten!: PersonInfoKontextErreichbarkeitResponseV1 [];

    @ApiProperty()
    public personenstatus?: string;

    @ApiProperty({})
    public readonly gruppen!: object[];

    protected constructor(props: Readonly<Omit<PersonInfoKontextResponseV1, 'gruppen'>>) {
        this.id = props.id;
        this.organisation = props.organisation;
        this.rolle = props.rolle!;
        this.personenstatus = props.personenstatus!;
        this.gruppen = [];
    }

    public static createNew(
        primaryNonKlassenKontext: KontextWithOrgaAndRolle,
        associatedKlassenKontexte: KontextWithOrgaAndRolle [],
        person: Person<true>,
        email?: PersonEmailResponse
    ): PersonInfoKontextResponseV1 {
        const personenInfoKontextOrganisationResponseV1 = PersonenInfoKontextOrganisationResponseV1.createNew({
            id: primaryNonKlassenKontext.organisation.id,
            kennung: primaryNonKlassenKontext.organisation.kennung,
            name: primaryNonKlassenKontext.organisation.name,
            typ: primaryNonKlassenKontext.organisation.typ === OrganisationsTyp.SCHULE ? 'Schule' : 'Sonstige'
        })
        const personInfoKontextErreichbarkeitResponseV1 = email?.status === EmailAddressStatus.ENABLED ? new PersonInfoKontextErreichbarkeitResponseV1({
            typ: 'E-Mail',
            kennung: email.address
        }) : null;
        return new PersonInfoKontextResponseV1({
            id: primaryNonKlassenKontext.personenkontext.id,
            organisation: personenInfoKontextOrganisationResponseV1,
            rolle: primaryNonKlassenKontext.rolle.rollenart.toString(),
            erreichbarkeiten: personInfoKontextErreichbarkeitResponseV1 ? [personInfoKontextErreichbarkeitResponseV1] : [],
            personenstatus: person.isLocked ? undefined : 'Aktiv'
        });
    }
}
