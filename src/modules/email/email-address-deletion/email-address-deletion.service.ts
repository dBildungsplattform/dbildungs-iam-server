import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EmailRepo } from '../persistence/email.repo.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { EmailAddress } from '../domain/email-address.js';
import { PersonID } from '../../../shared/types/aggregate-ids.types.js';
import { Person } from '../../person/domain/person.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';

@Injectable()
export class EmailAddressDeletionService {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly emailRepo: EmailRepo,
        private readonly personRepository: PersonRepository,
    ) {}

    public async deleteEmailAddresses(permissions: PersonPermissions): Promise<void> {
        const emailAddresses: EmailAddress<true>[] = await this.emailRepo.getEmailAddressesDeleteList();

        for (const ea of emailAddresses) {
            this.logger.info(`id:${ea.id}, address:${ea.address}, status:${ea.status}`);
        }
        const affectedPersonIds: PersonID[] = emailAddresses.map((ea: EmailAddress<true>) => ea.personId);
        const uniqueAffectedPersonIdSet: Set<PersonID> = new Set(affectedPersonIds);
        const uniqueAffectedPersonIds: PersonID[] = Array.from(uniqueAffectedPersonIdSet);

        const affectedPersons: Person<true>[] = await this.personRepository.findByIds(
            uniqueAffectedPersonIds,
            permissions,
        );

        for (const person of affectedPersons) {
            this.logger.info(`id:${person.id}, vorname:${person.vorname}, familienname:${person.familienname}`);
        }

        const personIdsWithoutAnyEmailAddresses: PersonID[] =
            await this.getAffectedPersonsWithoutEmailAddresses(uniqueAffectedPersonIds);
        this.logger.info(JSON.stringify(personIdsWithoutAnyEmailAddresses));
    }

    private async getAffectedPersonsWithoutEmailAddresses(uniqueAffectedPersonIds: PersonID[]): Promise<PersonID[]> {
        const personIdsWithoutAnyEmailAddresses: PersonID[] = [];

        await Promise.allSettled(
            uniqueAffectedPersonIds.map(async (personId: PersonID) => {
                const emailAddressesForPerson: EmailAddress<true>[] =
                    await this.emailRepo.findByPersonSortedByUpdatedAtDesc(personId);
                if (emailAddressesForPerson.length == 0) {
                    personIdsWithoutAnyEmailAddresses.push(personId);
                }
            }),
        );

        return personIdsWithoutAnyEmailAddresses;
    }
}
