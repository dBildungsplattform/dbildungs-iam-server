import { Injectable } from "@nestjs/common";
import { PersonID } from "../../../../../shared/types";
import { PermittedOrgas, PersonPermissions } from "../../../../authentication/domain/person-permissions";
import { DBiamPersonenkontextRepo, KontextWithOrgaAndRolle } from "../../../../personenkontext/persistence/dbiam-personenkontext.repo";
import { RollenSystemRecht } from "../../../../rolle/domain/rolle.enums.js";
import { EmailRepo } from "../../../../email/persistence/email.repo";
import { PersonEmailResponse } from "../../person-email-response";
import { UserLockRepository } from "../../../../keycloak-administration/repository/user-lock.repository";
import { UserLock } from "../../../../keycloak-administration/domain/user-lock";
import { PersonRepository } from "../../../persistence/person.repository";

@Injectable()
export class PersonInfoService {
    public constructor(
        private readonly personRepo: PersonRepository,
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly emailRepo: EmailRepo,
        private readonly userLockRepo: UserLockRepository
    ) {}

    public async findPersonsForPersonenInfo(
        permissions: PersonPermissions,
    ): Promise<PersonID[]> {
        // 1. Ermittle alle Knoten mit PERSONEN_LESEN-Recht
        const permittedOrgas: PermittedOrgas = await permissions.getOrgIdsWithSystemrecht([RollenSystemRecht.PERSONEN_LESEN], true);
        const permittedOrgaIds = permittedOrgas.all ? undefined : permittedOrgas.orgaIds

        // 2. Ermittle alle Rollen des Aufrufers mit PERSONEN_LESEN
        const aufruferKontexte = await this.personenkontextRepo.findByPersonWithOrgaAndRolle(permissions.personFields.id);
        const permittedServiceProviderIds = new Set<string>();

        for (const kontext of aufruferKontexte) {
            const rolle = kontext.rolle;
            const hasSystemrecht = rolle.systemrechte.some(
                (recht: RollenSystemRecht) => recht === RollenSystemRecht.PERSONEN_LESEN,
            );
            if (hasSystemrecht) {
                rolle.serviceProviderIds.forEach(sid => permittedServiceProviderIds.add(sid));
            }
        }

        if (permittedServiceProviderIds.size === 0) {
            return [];
        }

        const personIds: PersonID[] = await this.personenkontextRepo.findPersonIdsWithKontextAtServiceProvidersAndOptionallyOrganisations(
            permittedServiceProviderIds,
            permittedOrgaIds ? new Set<string>(permittedOrgaIds) : undefined,
            10,
            10
        );

        const [emailsForPersons, kontexteForPersons, userLocksForPersons]: [
            Map<PersonID, PersonEmailResponse>,
            Map<PersonID, KontextWithOrgaAndRolle[]>,
            Map<PersonID, UserLock[]>
        ] = await Promise.all([
            this.emailRepo.getEmailAddressAndStatusForPersonIds(personIds),
            this.personenkontextRepo.findByPersonIdsWithOrgaAndRolle(personIds),
            this.userLockRepo.findByPersonIds(personIds)
        ]);

    }
}
