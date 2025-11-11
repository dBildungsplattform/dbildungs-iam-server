import { Injectable } from '@nestjs/common';
import { PermittedOrgas, PersonPermissions } from '../../../authentication/domain/person-permissions.js';
import {
    DBiamPersonenkontextRepo,
    KontextWithOrgaAndRolle,
} from '../../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RollenSystemRecht } from '../../../rolle/domain/systemrecht.js';
import { EmailRepo } from '../../../email/persistence/email.repo.js';
import { PersonEmailResponse } from '../../../person/api/person-email-response.js';
import { UserLockRepository } from '../../../keycloak-administration/repository/user-lock.repository.js';
import { UserLock } from '../../../keycloak-administration/domain/user-lock.js';
import { PersonRepository } from '../../../person/persistence/person.repository.js';
import { Rolle } from '../../../rolle/domain/rolle.js';
import { Person } from '../../../person/domain/person.js';
import { PersonInfoResponseV1 } from '../../api/personinfo/v1/person-info.response.v1.js';
import { PersonID } from '../../../../shared/types/index.js';
import { SchulconnexRepo } from '../../persistence/schulconnex.repo.js';

@Injectable()
export class PersonenInfoService {
    public constructor(
        private readonly personRepo: PersonRepository,
        private readonly schulconnexRepo: SchulconnexRepo,
        private readonly personenkontextRepo: DBiamPersonenkontextRepo,
        private readonly emailRepo: EmailRepo,
        private readonly userLockRepo: UserLockRepository,
    ) {}

    public async findPersonsForPersonenInfo(
        permissions: PersonPermissions,
        offset: number,
        limit: number,
    ): Promise<PersonInfoResponseV1[]> {
        // 1. Ermittle alle Knoten mit PERSONEN_LESEN-Recht
        const permittedOrgas: PermittedOrgas = await permissions.getOrgIdsWithSystemrecht(
            [RollenSystemRecht.PERSONEN_LESEN],
            true,
        );

        // 2. Ermittle alle Rollen des Aufrufers mit PERSONEN_LESEN
        const aufruferKontexte: KontextWithOrgaAndRolle[] = await this.personenkontextRepo.findByPersonWithOrgaAndRolle(
            permissions.personFields.id,
        );
        const permittedServiceProviderIds: Set<string> = new Set<string>();

        for (const kontext of aufruferKontexte) {
            const rolle: Rolle<true> = kontext.rolle;
            const hasSystemrecht: boolean = rolle.systemrechte.some(
                (recht: RollenSystemRecht) => recht === RollenSystemRecht.PERSONEN_LESEN,
            );
            if (hasSystemrecht) {
                rolle.serviceProviderIds.forEach((sid: string) => permittedServiceProviderIds.add(sid));
            }
        }

        if (permittedServiceProviderIds.size === 0) {
            return [];
        }

        const [idsWithKontext, idsWithRollenerweiterung]: [PersonID[], PersonID[]] = await Promise.all([
            this.schulconnexRepo.findPersonIdsWithKontextAtServiceProvidersAndOptionallyOrganisations(
                permittedServiceProviderIds,
                permittedOrgas.all ? 'all' : new Set<string>(permittedOrgas.orgaIds),
            ),
            this.schulconnexRepo.findPersonIdsWithRollenerweiterungForServiceProviderAndOptionallyOrganisations(
                permittedServiceProviderIds,
                permittedOrgas.all ? 'all' : new Set<string>(permittedOrgas.orgaIds),
            ),
        ]);

        const personIds: PersonID[] = Array.from(new Set([...idsWithRollenerweiterung, ...idsWithKontext]))
            .sort((a: string, b: string) => a.localeCompare(b))
            .slice(offset, offset + limit);

        const [persons, emailsForPersons, kontexteForPersons, userLocksForPersons]: [
            Person<true>[],
            Map<PersonID, PersonEmailResponse>,
            Map<PersonID, KontextWithOrgaAndRolle[]>,
            Map<PersonID, UserLock[]>,
        ] = await Promise.all([
            this.personRepo.findByPersonIds(personIds),
            this.emailRepo.getEmailAddressAndStatusForPersonIds(personIds),
            this.personenkontextRepo.findByPersonIdsAndServiceprovidersWithOrgaAndRolle(
                personIds,
                Array.from(permittedServiceProviderIds),
                permittedOrgas,
            ),
            this.userLockRepo.findByPersonIds(personIds),
        ]);

        const responses: PersonInfoResponseV1[] = persons.map((person: Person<true>) => {
            const personId: PersonID = person.id;
            const email: PersonEmailResponse | undefined = emailsForPersons.get(personId);
            const kontexteWithOrgaAndRolle: KontextWithOrgaAndRolle[] = kontexteForPersons.get(personId) ?? [];
            const userLocks: UserLock[] = userLocksForPersons.get(personId) ?? [];

            return PersonInfoResponseV1.createNew(person, kontexteWithOrgaAndRolle, email, userLocks);
        });

        return responses;
    }
}
