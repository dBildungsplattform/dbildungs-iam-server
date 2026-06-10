import { ApiProperty } from '@nestjs/swagger';
import { KontextWithOrgaAndRolle } from '../../../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonEmailResponse } from '../../../../person/api/person-email-response.js';
import { EmailAddressStatus } from '../../../../email/domain/email-address.js';
import { OrganisationsTyp } from '../../../../organisation/domain/organisation.enums.js';
import {
    SchulconnexErreichbarkeitTyp,
    SchulconnexPersonenstatus,
    SchulconnexGruppeTyp,
    SchulconnexOrganisationTyp,
    SchulconnexRolle,
    convertSPSHRollenartToSchulconnexRolleV2,
} from '../../schulconnex-enums.js';
import { UserLock } from '../../../../keycloak-administration/domain/user-lock.js';
import { PersonenInfoKontextOrganisationResponseV1 } from '../v1/person-info-kontext-organisation.response.v1.js';
import { PersonenInfoKontextOrganisationResponseV2 } from './person-info-kontext-organisation.response.v2.js';
import { PersonInfoKontextErreichbarkeitResponseV1 } from '../v1/person-info-kontext-erreichbarkeit.response.v1.js';
import { PersonInfoKontextErreichbarkeitResponseV2 } from './person-info-kontext-erreichbarkeit.response.v2.js';
import { PersonenInfoKontextGruppeResponseV1 } from '../v1/person-info-kontext-gruppe.response.v1.js';
import { PersonenInfoKontextGruppeResponseV2 } from './person-info-kontext-gruppe.response.v2.js';

export class PersonInfoKontextResponseV2 {
    @ApiProperty()
    public id: string;

    @ApiProperty({ type: PersonenInfoKontextOrganisationResponseV2 })
    public organisation: PersonenInfoKontextOrganisationResponseV2;

    @ApiProperty({ enum: SchulconnexRolle })
    public rolle: SchulconnexRolle;

    @ApiProperty({ type: [PersonInfoKontextErreichbarkeitResponseV2] })
    public erreichbarkeiten: PersonInfoKontextErreichbarkeitResponseV2[];

    @ApiProperty({ enum: SchulconnexPersonenstatus, nullable: true })
    public personenstatus?: SchulconnexPersonenstatus;

    @ApiProperty({ type: [PersonenInfoKontextGruppeResponseV2] })
    public readonly gruppen: PersonenInfoKontextGruppeResponseV2[];

    protected constructor(props: Readonly<PersonInfoKontextResponseV2>) {
        this.id = props.id;
        this.organisation = props.organisation;
        this.rolle = props.rolle;
        this.erreichbarkeiten = props.erreichbarkeiten;
        this.personenstatus = props.personenstatus;
        this.gruppen = props.gruppen;
    }

    public static createNew(
        primaryNonKlassenKontext: KontextWithOrgaAndRolle,
        associatedKlassenKontexte: KontextWithOrgaAndRolle[],
        userlocks: UserLock[],
        email?: PersonEmailResponse,
    ): PersonInfoKontextResponseV2 {
        const personenInfoKontextOrganisationResponseV2: PersonenInfoKontextOrganisationResponseV2 =
            PersonenInfoKontextOrganisationResponseV1.createNew({
                id: primaryNonKlassenKontext.organisation.id,
                kennung: primaryNonKlassenKontext.organisation.kennung,
                name: primaryNonKlassenKontext.organisation.name,
                typ:
                    primaryNonKlassenKontext.organisation.typ === OrganisationsTyp.SCHULE
                        ? SchulconnexOrganisationTyp.SCHULE
                        : SchulconnexOrganisationTyp.SONSTIGE,
            });
        const personInfoKontextErreichbarkeitResponseV2: PersonInfoKontextErreichbarkeitResponseV2 | null =
            email?.status === EmailAddressStatus.ENABLED
                ? new PersonInfoKontextErreichbarkeitResponseV1({
                      typ: SchulconnexErreichbarkeitTyp.EMAIL,
                      kennung: email.address,
                  })
                : null;
        const gruppen: PersonenInfoKontextGruppeResponseV2[] = associatedKlassenKontexte.map(
            (klassenKontext: KontextWithOrgaAndRolle) => {
                return PersonenInfoKontextGruppeResponseV1.createNew({
                    id: klassenKontext.organisation.id,
                    bezeichnung: klassenKontext.organisation.name ?? '',
                    typ: SchulconnexGruppeTyp.KLASSE,
                });
            },
        );
        return new PersonInfoKontextResponseV2({
            id: primaryNonKlassenKontext.personenkontext.id,
            organisation: personenInfoKontextOrganisationResponseV2,
            rolle: convertSPSHRollenartToSchulconnexRolleV2(primaryNonKlassenKontext.rolle.rollenart),
            erreichbarkeiten: personInfoKontextErreichbarkeitResponseV2
                ? [personInfoKontextErreichbarkeitResponseV2]
                : [],
            personenstatus: userlocks.length > 0 ? undefined : SchulconnexPersonenstatus.AKTIV,
            gruppen: gruppen,
        });
    }
}
