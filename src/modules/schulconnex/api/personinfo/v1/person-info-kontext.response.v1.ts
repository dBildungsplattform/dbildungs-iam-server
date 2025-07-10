import { ApiProperty } from '@nestjs/swagger';
import { PersonInfoKontextErreichbarkeitResponseV1 } from './person-info-kontext-erreichbarkeit.response.v1.js';
import { KontextWithOrgaAndRolle } from '../../../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { PersonEmailResponse } from '../../../../person/api/person-email-response.js';
import { EmailAddressStatus } from '../../../../email/domain/email-address.js';
import { OrganisationsTyp } from '../../../../organisation/domain/organisation.enums.js';
import { PersonenInfoKontextGruppeResponseV1 } from './person-info-kontext-gruppe.response.v1.js';
import { PersonenInfoKontextOrganisationResponseV1 } from './person-info-kontext-organisation.response.v1.js';
import {
    SchulconnexErreichbarkeitTyp,
    SchulconnexPersonenstatus,
    SchulconnexGruppeTyp,
    SchulconnexOrganisationTyp,
    SchulconnexRolle,
    convertSPSHRollenartToSchulconnexRolle,
} from '../../schulconnex-enums.v1.js';
import { UserLock } from '../../../../keycloak-administration/domain/user-lock.js';

export class PersonInfoKontextResponseV1 {
    @ApiProperty()
    public id: string;

    @ApiProperty({ type: PersonenInfoKontextOrganisationResponseV1 })
    public organisation: PersonenInfoKontextOrganisationResponseV1;

    @ApiProperty({ enum: SchulconnexRolle })
    public rolle: SchulconnexRolle;

    @ApiProperty({ type: [PersonInfoKontextErreichbarkeitResponseV1] })
    public erreichbarkeiten: PersonInfoKontextErreichbarkeitResponseV1[];

    @ApiProperty({ enum: SchulconnexPersonenstatus, nullable: true })
    public personenstatus?: SchulconnexPersonenstatus;

    @ApiProperty({ type: [PersonenInfoKontextGruppeResponseV1] })
    public readonly gruppen: PersonenInfoKontextGruppeResponseV1[];

    protected constructor(props: Readonly<PersonInfoKontextResponseV1>) {
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
    ): PersonInfoKontextResponseV1 {
        const personenInfoKontextOrganisationResponseV1: PersonenInfoKontextOrganisationResponseV1 =
            PersonenInfoKontextOrganisationResponseV1.createNew({
                id: primaryNonKlassenKontext.organisation.id,
                kennung: primaryNonKlassenKontext.organisation.kennung,
                name: primaryNonKlassenKontext.organisation.name,
                typ:
                    primaryNonKlassenKontext.organisation.typ === OrganisationsTyp.SCHULE
                        ? SchulconnexOrganisationTyp.SCHULE
                        : SchulconnexOrganisationTyp.SONSTIGE,
            });
        const personInfoKontextErreichbarkeitResponseV1: PersonInfoKontextErreichbarkeitResponseV1 | null =
            email?.status === EmailAddressStatus.ENABLED
                ? new PersonInfoKontextErreichbarkeitResponseV1({
                      typ: SchulconnexErreichbarkeitTyp.EMAIL,
                      kennung: email.address,
                  })
                : null;
        const gruppen: PersonenInfoKontextGruppeResponseV1[] = associatedKlassenKontexte.map(
            (klassenKontext: KontextWithOrgaAndRolle) => {
                return PersonenInfoKontextGruppeResponseV1.createNew({
                    id: klassenKontext.organisation.id,
                    bezeichnung: klassenKontext.organisation.name ?? '',
                    typ: SchulconnexGruppeTyp.KLASSE,
                });
            },
        );
        return new PersonInfoKontextResponseV1({
            id: primaryNonKlassenKontext.personenkontext.id,
            organisation: personenInfoKontextOrganisationResponseV1,
            rolle: convertSPSHRollenartToSchulconnexRolle(primaryNonKlassenKontext.rolle.rollenart),
            erreichbarkeiten: personInfoKontextErreichbarkeitResponseV1
                ? [personInfoKontextErreichbarkeitResponseV1]
                : [],
            personenstatus: userlocks.length > 0 ? undefined : SchulconnexPersonenstatus.AKTIV,
            gruppen: gruppen,
        });
    }
}
