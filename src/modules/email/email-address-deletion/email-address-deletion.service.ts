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
import { OXUserID } from '../../../shared/types/ox-ids.types.js';
import { EmailAddressesPurgedEvent } from '../../../shared/events/email-addresses-purged.event.js';

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
            this.eventService.publish(
                new EmailAddressDeletedEvent(ea.personId, username, ea.oxUserID, ea.id, ea.status, ea.address),
            );
        }
    }

    public async checkRemainingEmailAddressesByPersonId(personId: PersonID, oxUserId: OXUserID): Promise<void> {
        const person: Option<Person<true>> = await this.personRepository.findById(personId);
        if (!person) {
            return this.logger.error(
                `Could not check for remaining EmailAddresses, no Person found for personId:${personId}`,
            );
        }
        if (!person.referrer) {
            return this.logger.error(
                `Would not be able to create EmailAddressesPurgedEvent, no referrer found for personId:${personId}`,
            );
        }
        const allEmailAddressesForPerson: EmailAddress<true>[] =
            await this.emailRepo.findByPersonSortedByUpdatedAtDesc(personId);
        if (allEmailAddressesForPerson.length == 0) {
            this.logger.info(
                `No remaining EmailAddresses for Person, publish EmailAddressesPurgedEvent, personId:${personId}, referrer:${person.referrer}`,
            );
            return this.eventService.publish(new EmailAddressesPurgedEvent(personId, person.referrer, oxUserId));
        }
        this.logger.info(
            `Person has remaining EmailAddresses, WON'T publish EmailAddressesPurgedEvent, personId:${personId}, referrer:${person.referrer}`,
        );
    }
}
