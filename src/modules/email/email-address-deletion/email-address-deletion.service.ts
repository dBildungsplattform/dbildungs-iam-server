import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EmailRepo } from '../persistence/email.repo.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { EmailAddress, EmailAddressStatus } from '../domain/email-address.js';
import { PersonID, PersonReferrer } from '../../../shared/types/aggregate-ids.types.js';
import { Person } from '../../person/domain/person.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { EventService } from '../../../core/eventbus/services/event.service.js';
import { EmailAddressDeletedEvent } from '../../../shared/events/email-address-deleted.event.js';
import { OXUserID } from '../../../shared/types/ox-ids.types.js';

type ReferrerAndOxUserId = {
    oxUserName: PersonReferrer;
    oxUserId: OXUserID;
};

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
        const affectedPersonIds: PersonID[] = nonPrimaryEmailAddresses.map((ea: EmailAddress<true>) => ea.personId);
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
        const emailPersonMap: Map<PersonID, ReferrerAndOxUserId> = new Map<PersonID, ReferrerAndOxUserId>();

        for (const ea of nonPrimaryEmailAddresses) {
            const username: string | undefined = personMap.get(ea.personId)?.referrer;
            if (!username) {
                this.logger.error(
                    `Could NOT get username when generating EmailAddressDeletedEvent, personId:${ea.personId}`,
                );
                continue;
            }
            if (!ea.oxUserID) {
                this.logger.error(
                    `Could NOT get oxUserId when generating EmailAddressDeletedEvent, personId:${ea.personId}, referrer:${username}`,
                );
                continue;
            }
            emailPersonMap.set(ea.personId, {
                oxUserName: username,
                oxUserId: ea.oxUserID,
            });
            this.eventService.publish(
                new EmailAddressDeletedEvent(ea.personId, username, ea.oxUserID, ea.id, ea.status, ea.address),
            );
        }

        for (const person of affectedPersons) {
            this.logger.info(
                `Affected Person: personId:${person.id}, referrer:${person.referrer}, vorname:${person.vorname}, familienname:${person.familienname}`,
            );
        }

        // const personIdsWithoutAnyEmailAddresses: PersonID[] = await this.getAffectedPersonsWithoutEmailAddresses(
        //     uniqueAffectedPersonIds,
        //     nonPrimaryEmailAddresses,
        // );
        //this.logger.info(JSON.stringify(personIdsWithoutAnyEmailAddresses));
        //this.publishPersonPurgeEvents(personIdsWithoutAnyEmailAddresses, emailPersonMap);
    }

    /*private async getAffectedPersonsWithoutEmailAddresses(
        uniqueAffectedPersonIds: PersonID[],
        emailAddressesForDeletion: EmailAddress<true>[],
    ): Promise<PersonID[]> {
        const personIdsWithoutAnyEmailAddresses: PersonID[] = [];

        await Promise.allSettled(
            uniqueAffectedPersonIds.map(async (personId: PersonID) => {
                const emailAddressesForPerson: EmailAddress<true>[] =
                    await this.emailRepo.findByPersonSortedByUpdatedAtDesc(personId);
                const remainingEmailAddressesForPerson: EmailAddress<true>[] = emailAddressesForPerson.filter(
                    (ea: EmailAddress<true>) =>
                        emailAddressesForDeletion.every((ead: EmailAddress<true>) => ead.id !== ea.id),
                );
                if (remainingEmailAddressesForPerson.length == 0) {
                    personIdsWithoutAnyEmailAddresses.push(personId);
                }
            }),
        );

        return personIdsWithoutAnyEmailAddresses;
    }

    private publishPersonPurgeEvents(personIds: PersonID[], emailPersonMap: Map<PersonID, ReferrerAndOxUserId>): void {
        for (const personId of personIds) {
            const data: ReferrerAndOxUserId | undefined = emailPersonMap.get(personId);
            if (!data) {
                this.logger.error(`Could not create PurgeEvent, no data for personId:${personId}`);
                continue;
            }
            if (!data.oxUserId) {
                this.logger.error(`Could not create PurgeEvent, no OxUserId for personId:${personId}`);
                continue;
            }
            this.eventService.publish(new EmailAddressesPurgedEvent(personId, data.oxUserName, data.oxUserId));
        }
    }*/
}
