import { Injectable } from '@nestjs/common';
import { EventRoutingLegacyKafkaService } from '../../../core/eventbus/services/event-routing-legacy-kafka.service.js';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EmailAddressMarkedForDeletionEvent } from '../../../shared/events/email/email-address-marked-for-deletion.event.js';
import { EmailAddressesPurgedEvent } from '../../../shared/events/email/email-addresses-purged.event.js';
import { KafkaEmailAddressMarkedForDeletionEvent } from '../../../shared/events/email/kafka-email-address-marked-for-deletion.event.js';
import { KafkaEmailAddressesPurgedEvent } from '../../../shared/events/email/kafka-email-addresses-purged.event.js';
import { PersonID } from '../../../shared/types/aggregate-ids.types.js';
import { OXUserID } from '../../../shared/types/ox-ids.types.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { Person } from '../../person/domain/person.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { EmailAddress } from '../domain/email-address.js';
import { EmailRepo } from '../persistence/email.repo.js';

@Injectable()
export class EmailAddressDeletionService {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly emailRepo: EmailRepo,
        private readonly personRepository: PersonRepository,
        private readonly eventService: EventRoutingLegacyKafkaService,
    ) {}

    /**
     *
     * @param permissions
     * @param limit
     * @returns { processed: number; total: number } - processed: number of email addresses processed in this run, total: total number of email addresses that are marked for deletion or exceeded the deadline
     */
    public async deleteEmailAddresses(
        permissions: PersonPermissions,
        limit: number,
    ): Promise<{ processed: number; total: number }> {
        const [nonPrimaryEmailAddresses, total]: [EmailAddress<true>[], number] =
            await this.emailRepo.getByDeletedStatusOrUpdatedAtExceedsDeadline(limit);
        const affectedPersonIds: (PersonID | undefined)[] = nonPrimaryEmailAddresses.map(
            (ea: EmailAddress<true>) => ea.personId,
        );
        const affectedPersonIdsFiltered: PersonID[] = affectedPersonIds.filter(
            (apid: PersonID | undefined) => apid !== undefined,
        );
        const uniqueAffectedPersonIdSet: Set<PersonID> = new Set(affectedPersonIdsFiltered);
        const uniqueAffectedPersonIds: PersonID[] = Array.from(uniqueAffectedPersonIdSet);

        const affectedPersons: Person<true>[] = await this.personRepository.findByIds(
            uniqueAffectedPersonIds,
            permissions,
        );
        const personMap: Map<PersonID, Person<true>> = new Map<PersonID, Person<true>>();
        affectedPersons.forEach((p: Person<true>) => {
            personMap.set(p.id, p);
        });
        let processed: number = 0;

        for (const ea of nonPrimaryEmailAddresses) {
            if (!ea.oxUserID) {
                this.logger.error(
                    `Could NOT get oxUserId when generating EmailAddressDeletedEvent, personId:${ea.personId}`,
                );
                continue;
            }
            if (!ea.personId) {
                this.logger.info(
                    `Could NOT get information about EmailAddress when generating EmailAddressDeletedEvent because personId was UNDEFINED, address:${ea.address}`,
                );
                this.eventService.publish(
                    new EmailAddressMarkedForDeletionEvent(
                        ea.personId,
                        undefined,
                        ea.oxUserID,
                        ea.id,
                        ea.status,
                        ea.address,
                    ),
                    new KafkaEmailAddressMarkedForDeletionEvent(
                        ea.personId,
                        undefined,
                        ea.oxUserID,
                        ea.id,
                        ea.status,
                        ea.address,
                    ),
                );
                processed++;
                continue;
            }
            const username: string | undefined = personMap.get(ea.personId)?.username;
            if (!username) {
                this.logger.error(
                    `Could NOT get username when generating EmailAddressDeletedEvent, personId:${ea.personId}`,
                );
                continue;
            }
            this.eventService.publish(
                new EmailAddressMarkedForDeletionEvent(
                    ea.personId,
                    username,
                    ea.oxUserID,
                    ea.id,
                    ea.status,
                    ea.address,
                ),
                new KafkaEmailAddressMarkedForDeletionEvent(
                    ea.personId,
                    username,
                    ea.oxUserID,
                    ea.id,
                    ea.status,
                    ea.address,
                ),
            );
            processed++;
        }
        return { processed, total };
    }

    public async checkRemainingEmailAddressesByPersonId(
        personId: PersonID | undefined,
        oxUserId: OXUserID,
    ): Promise<void> {
        if (!personId) {
            this.logger.info(
                `PersonId UNDEFINED when checking remaining EmailAddresses for person, oxUserId:${oxUserId}`,
            );
            return this.eventService.publish(
                new EmailAddressesPurgedEvent(personId, undefined, oxUserId),
                new KafkaEmailAddressesPurgedEvent(personId, undefined, oxUserId),
            );
        }
        const person: Option<Person<true>> = await this.personRepository.findById(personId);
        if (!person) {
            return this.logger.error(
                `Could not check for remaining EmailAddresses, no Person found for personId:${personId}`,
            );
        }
        const allEmailAddressesForPerson: EmailAddress<true>[] =
            await this.emailRepo.findByPersonSortedByUpdatedAtDesc(personId);
        if (allEmailAddressesForPerson.length === 0) {
            this.logger.info(
                `No remaining EmailAddresses for Person, publish EmailAddressesPurgedEvent, personId:${personId}, username:${person.username}`,
            );
            return this.eventService.publish(
                new EmailAddressesPurgedEvent(personId, person.username, oxUserId),
                new KafkaEmailAddressesPurgedEvent(personId, person.username, oxUserId),
            );
        }
        this.logger.info(
            `Person has remaining EmailAddresses, WON'T publish EmailAddressesPurgedEvent, personId:${personId}, username:${person.username}`,
        );
    }
}
