import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../../core/logging/class-logger.js';
import { EmailRepo } from '../persistence/email.repo.js';
import { PersonRepository } from '../../person/persistence/person.repository.js';
import { EmailAddress, EmailAddressStatus } from '../domain/email-address.js';
import { PersonID } from '../../../shared/types/aggregate-ids.types.js';
import { Person } from '../../person/domain/person.js';
import { PersonPermissions } from '../../authentication/domain/person-permissions.js';
import { EventRoutingLegacyKafkaService } from '../../../core/eventbus/services/event-routing-legacy-kafka.service.js';
import { EmailAddressMarkedForDeletionEvent } from '../../../shared/events/email/email-address-marked-for-deletion.event.js';
import { OXUserID } from '../../../shared/types/ox-ids.types.js';
import { EmailAddressesPurgedEvent } from '../../../shared/events/email/email-addresses-purged.event.js';

@Injectable()
export class EmailAddressDeletionService {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly emailRepo: EmailRepo,
        private readonly personRepository: PersonRepository,
        private readonly eventService: EventRoutingLegacyKafkaService,
    ) {}

    public async deleteEmailAddresses(permissions: PersonPermissions): Promise<void> {
        const emailAddresses: EmailAddress<true>[] =
            await this.emailRepo.getByDeletedStatusOrUpdatedAtExceedsDeadline();
        const nonPrimaryEmailAddresses: EmailAddress<true>[] = emailAddresses.filter(
            (ea: EmailAddress<true>) => ea.status !== EmailAddressStatus.ENABLED,
        );
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
                    /*new KafkaEmailAddressDeletedEvent(
                        ea.personId,
                        undefined,
                        ea.oxUserID,
                        ea.id,
                        ea.status,
                        ea.address,
                    ),*/
                );
                continue;
            }
            const username: string | undefined = personMap.get(ea.personId)?.referrer;
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
                //new KafkaEmailAddressDeletedEvent(ea.personId, username, ea.oxUserID, ea.id, ea.status, ea.address),
            );
        }
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
                //new KafkaEmailAddressesPurgedEvent(personId, undefined, oxUserId),
            );
        }
        const person: Option<Person<true>> = await this.personRepository.findById(personId);
        if (!person) {
            return this.logger.error(
                `Could not check for remaining EmailAddresses, no Person found for personId:${personId}`,
            );
        }
        /*       if (!person.referrer) {
            return this.logger.error(
                `Would not be able to create EmailAddressesPurgedEvent, no username found for personId:${personId}`,
            );
        }*/
        const allEmailAddressesForPerson: EmailAddress<true>[] =
            await this.emailRepo.findByPersonSortedByUpdatedAtDesc(personId);
        if (allEmailAddressesForPerson.length == 0) {
            this.logger.info(
                `No remaining EmailAddresses for Person, publish EmailAddressesPurgedEvent, personId:${personId}, username:${person.referrer}`,
            );
            return this.eventService.publish(
                new EmailAddressesPurgedEvent(personId, person.referrer, oxUserId),
                //new KafkaEmailAddressesPurgedEvent(personId, person.referrer, oxUserId),
            );
        }
        this.logger.info(
            `Person has remaining EmailAddresses, WON'T publish EmailAddressesPurgedEvent, personId:${personId}, username:${person.referrer}`,
        );
    }
}
