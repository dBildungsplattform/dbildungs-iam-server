import { ApiProperty } from '@nestjs/swagger';
import { PersonInfoKontextErreichbarkeitResponseV1} from './person-info-kontext-erreichbarkeit.response.v1.js';
import { KontextWithOrgaAndRolle } from '../../../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonEmailResponse } from '../../person-email-response.js';
import { EmailAddressStatus } from '../../../../email/domain/email-address.js';
import { OrganisationsTyp } from '../../../../organisation/domain/organisation.enums.js';
import { PersonenInfoKontextGruppeResponseV1 } from './person-info-kontext-gruppe.response.v1.js';
import { PersonenInfoKontextOrganisationResponseV1 } from './person-info-kontext-organisation.response.v1.js';
import { PersonInfoKontextV1ErreichbarkeitTyp, PersonInfoKontextV1Personenstatus, PersonInfoKontextV1GruppeTyp, PersonInfoKontextV1OrganisationTyp, PersonInfoKontextV1Rolle, convertRollenartToPersonInfoKontextV1Rolle } from './person-info-enums.v1.js';
import { UserLock } from '../../../../keycloak-administration/domain/user-lock.js';

export class PersonInfoKontextResponseV1 {
    @ApiProperty()
    public id!: string;

    @ApiProperty({ type: PersonenInfoKontextOrganisationResponseV1 })
    public organisation!: PersonenInfoKontextOrganisationResponseV1;

    @ApiProperty({enum: PersonInfoKontextV1Rolle})
    public rolle!: PersonInfoKontextV1Rolle;

    @ApiProperty({ type: [PersonInfoKontextErreichbarkeitResponseV1] })
    public erreichbarkeiten!: PersonInfoKontextErreichbarkeitResponseV1 [];

    @ApiProperty({enum: PersonInfoKontextV1Personenstatus})
    public personenstatus?: PersonInfoKontextV1Personenstatus;

    @ApiProperty({type: [PersonenInfoKontextGruppeResponseV1]})
    public readonly gruppen!: PersonenInfoKontextGruppeResponseV1[];

    protected constructor(props: Readonly<PersonInfoKontextResponseV1>) {
        this.id = props.id;
        this.organisation = props.organisation;
        this.rolle = props.rolle!;
        this.erreichbarkeiten = props.erreichbarkeiten;
        this.personenstatus = props.personenstatus!;
        this.gruppen = props.gruppen;
    }

    public static createNew(
        primaryNonKlassenKontext: KontextWithOrgaAndRolle,
        associatedKlassenKontexte: KontextWithOrgaAndRolle [],
        userlocks: UserLock [],
        email?: PersonEmailResponse,
    ): PersonInfoKontextResponseV1 {
        const personenInfoKontextOrganisationResponseV1 = PersonenInfoKontextOrganisationResponseV1.createNew({
            id: primaryNonKlassenKontext.organisation.id,
            kennung: primaryNonKlassenKontext.organisation.kennung,
            name: primaryNonKlassenKontext.organisation.name,
            typ: primaryNonKlassenKontext.organisation.typ === OrganisationsTyp.SCHULE ? PersonInfoKontextV1OrganisationTyp.SCHULE : PersonInfoKontextV1OrganisationTyp.SONSTIGE
        })
        const personInfoKontextErreichbarkeitResponseV1 = email?.status === EmailAddressStatus.ENABLED ? new PersonInfoKontextErreichbarkeitResponseV1({
            typ: PersonInfoKontextV1ErreichbarkeitTyp.EMAIL,
            kennung: email.address
        }) : null;
        const gruppen = associatedKlassenKontexte.map(klassenKontext => {
            return PersonenInfoKontextGruppeResponseV1.createNew({
                id: klassenKontext.organisation.id,
                bezeichnung: klassenKontext.organisation.name ?? '',
                typ: PersonInfoKontextV1GruppeTyp.KLASSE
            })
        })
        return new PersonInfoKontextResponseV1({
            id: primaryNonKlassenKontext.personenkontext.id,
            organisation: personenInfoKontextOrganisationResponseV1,
            rolle: convertRollenartToPersonInfoKontextV1Rolle(primaryNonKlassenKontext.rolle.rollenart),
            erreichbarkeiten: personInfoKontextErreichbarkeitResponseV1 ? [personInfoKontextErreichbarkeitResponseV1] : [],
            personenstatus: userlocks.length > 0 ? undefined : PersonInfoKontextV1Personenstatus.AKTIV,
            gruppen: gruppen
        });
    }
}
