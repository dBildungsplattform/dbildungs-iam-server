/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { PersonRepository } from '../persistence/person.repository.js';
import { PersonLandesbediensteterSearchResponse } from '../api/person-landesbediensteter-search.response.js';
import { Person } from '../domain/person.js';
import {
    DBiamPersonenkontextRepo,
    KontextWithOrgaAndRolle,
} from '../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { EmailRepo } from '../../email/persistence/email.repo.js';
import { PersonEmailResponse } from '../api/person-email-response.js';
import { UserLockRepository } from '../../keycloak-administration/repository/user-lock.repository.js';
import { UserLock } from '../../keycloak-administration/domain/user-lock.js';
import { PersonLockOccasion } from '../domain/person.enums.js';
import { LandesbediensteterSearchNoPersonFoundError } from '../domain/landesbediensteter-search-no-person-found.error.js';
import { LandesbediensteterSearchMultiplePersonsFoundError } from '../domain/landesbediensteter-search-multiple-persons-found.error.js';

@Injectable()
export class PersonLandesbediensteterSearchService {
    public constructor(
        private personRepository: PersonRepository,
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly userLockRepository: UserLockRepository,
        private readonly emailRepo: EmailRepo,
    ) {}

    public async findLandesbediensteter(
        personalnummer?: string,
        primaryEmailAddress?: string,
        username?: string,
        fullname?: string,
    ): Promise<PersonLandesbediensteterSearchResponse> {
        const definedParams: boolean[] = [
            personalnummer !== undefined,
            primaryEmailAddress !== undefined,
            username !== undefined,
            fullname !== undefined,
        ].filter(Boolean);

        if (definedParams.length !== 1) {
            throw new LandesbediensteterSearchNoPersonFoundError();
        }

        let persons: Person<true>[] = [];

        if (personalnummer) {
            persons = await this.personRepository.findByPersonalnummer(personalnummer.trim());
        } else if (primaryEmailAddress) {
            persons = await this.personRepository.findByPrimaryEmailAddress(primaryEmailAddress.trim());
        } else if (username) {
            persons = await this.personRepository.findByUsername(username.trim());
        } else if (fullname) {
            const [vorname, ...rest]: string[] = fullname.trim().split(/\s+/);
            if (!vorname || rest.length === 0) {
                throw new LandesbediensteterSearchNoPersonFoundError();
            }
            const familienname: string = rest.join(' ');
            persons = await this.personRepository.findByFullName(vorname, familienname);
        }

        if (persons.length > 1) {
            throw new LandesbediensteterSearchMultiplePersonsFoundError();
        }
        if (persons.length === 0) {
            throw new LandesbediensteterSearchNoPersonFoundError();
        }

        const person: Person<true> = persons.at(0)!;
        const locks: UserLock[] = await this.userLockRepository.findByPersonId(person.id);

        if (person.personalnummer == null) {
            throw new LandesbediensteterSearchNoPersonFoundError();
        }
        if (locks.findIndex((lock: UserLock) => lock.locked_occasion === PersonLockOccasion.MANUELL_GESPERRT) !== -1) {
            throw new LandesbediensteterSearchNoPersonFoundError();
        }

        const [email, kontexteWithOrgaAndRolle]: [Option<PersonEmailResponse>, Array<KontextWithOrgaAndRolle>] =
            await Promise.all([
                this.emailRepo.getEmailAddressAndStatusForPerson(person),
                this.dBiamPersonenkontextRepo.findByPersonWithOrgaAndRolle(person.id),
            ]);

        return PersonLandesbediensteterSearchResponse.createNew(person, kontexteWithOrgaAndRolle, email);
    }
}
