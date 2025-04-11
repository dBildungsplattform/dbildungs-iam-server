import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EmailRepo } from '../persistence/email.repo.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { EmailAddress, EmailAddressStatus } from '../domain/email-address.js';
import { PersonID } from '../../../shared/types/aggregate-ids.types.js';
import { Person } from '../../person/domain/person.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { EventService } from '../../../core/eventbus/services/event.service.js';
import { EmailAddressDeletedEvent } from '../../../shared/events/email-address-deleted.event.js';

@Injectable()
export class EmailAddressDeletionService {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly emailRepo: EmailRepo,
        private readonly personRepository: PersonRepository,
        private readonly eventService: EventService,
    ) {}

    public async deleteEmailAddresses(permissions: PersonPermissions): Promise<void> {
        const emailAddresses: EmailAddress<true>[] = await this.emailRepo.getEmailAddressesDeleteList();
        const nonPrimaryEmailAddresses: EmailAddress<true>[] = emailAddresses.filter(
            (ea: EmailAddress<true>) => ea.status !== EmailAddressStatus.ENABLED,
        );
        const primaryEmailAddresses: EmailAddress<true>[] = emailAddresses.filter(
            (ea: EmailAddress<true>) => ea.status === EmailAddressStatus.ENABLED,
        );
        this.logger.info('Non-primary EAs:');
        for (const ea of nonPrimaryEmailAddresses) {
            this.logger.info(`id:${ea.id}, address:${ea.address}, status:${ea.status}`);
        }
        this.logger.info('Primary EAs:');
        for (const ea of primaryEmailAddresses) {
            this.logger.info(`id:${ea.id}, address:${ea.address}, status:${ea.status}`);
        }
        const affectedPersonIds: PersonID[] = emailAddresses.map((ea: EmailAddress<true>) => ea.personId);
        const uniqueAffectedPersonIdSet: Set<PersonID> = new Set(affectedPersonIds);
        const uniqueAffectedPersonIds: PersonID[] = Array.from(uniqueAffectedPersonIdSet);

        const affectedPersons: Person<true>[] = await this.personRepository.findByIds(
            uniqueAffectedPersonIds,
            permissions,
        );
        const personMap: Map<PersonID, Person<true>> = new Map<PersonID, Person<true>>();
        affectedPersons.map((p: Person<true>) => {
            personMap.set(p.id, p);
        });

        for (const ea of emailAddresses) {
            const username: string | undefined = personMap.get(ea.personId)?.referrer;
            if (!username) {
                this.logger.error(
                    `Could NOT get username when generating EmailAddressDeletedEvent, personId:${ea.personId}`,
                );
            } else {
                this.eventService.publish(
                    new EmailAddressDeletedEvent(ea.personId, username, ea.id, ea.status, ea.address),
                );
            }
        }

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
