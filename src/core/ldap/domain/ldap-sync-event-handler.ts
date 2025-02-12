import { Injectable } from '@nestjs/common';
import { LdapClientService } from './ldap-client.service.ts';
import { ClassLogger } from '../../logging/class-logger.ts';
import { OrganisationRepository } from '../../../modules/organisation/persistence/organisation.repository.ts';
import { EventHandler } from '../../eventbus/decorators/event-handler.decorator.ts';
import { PersonExternalSystemsSyncEvent } from '../../../shared/events/person-external-systems-sync.event.ts';
import { Person } from '../../../modules/person/domain/person.ts';
import { PersonRepository } from '../../../modules/person/persistence/person.repository.ts';
import { EmailRepo } from '../../../modules/email/persistence/email.repo.ts';
import { EmailAddress, EmailAddressStatus } from '../../../modules/email/domain/email-address.ts';

/**
 * Handling of PersonExternalSystemsSyncEvent is done here, an additional class next to LdapEventHandler
 * for several reasons: maybe settings of features in here should be configurable in the future in contrast to LdapEventHandler (and reduce refactoring),
 * more processing logic is done in here, in contrast the LdapEventHandler passes the parameters to LdapClientService
 * and in the end this handler also shares some common data and common behavior with ItsLearningSyncEventHandler.
 */
@Injectable()
export class LdapSyncEventHandler {
    public constructor(
        private readonly logger: ClassLogger,
        private readonly ldapClientService: LdapClientService,
        private readonly personRepository: PersonRepository,
        private readonly organisationRepository: OrganisationRepository,
        private readonly emailRepo: EmailRepo,
    ) {}

    @EventHandler(PersonExternalSystemsSyncEvent)
    public async personExternalSystemSyncEventHandler(event: PersonExternalSystemsSyncEvent): Promise<void> {
        this.logger.info(`[EventID: ${event.eventID}] Received PersonExternalSystemsSyncEvent, ${event.personId}`);

        // Retrieve the person from the DB
        const person: Option<Person<true>> = await this.personRepository.findById(event.personId);
        if (!person) {
            return this.logger.error(
                `[EventID: ${event.eventID}] Person with ID ${event.personId} could not be found!`,
            );
        }

        // Check if person has a username
        if (!person.referrer) {
            return this.logger.error(`[EventID: ${event.eventID}] Person with ID ${event.personId} has no username!`);
        }

        const enabledEmailAddress: Option<EmailAddress<true>> = await this.emailRepo.findEnabledByPerson(
            event.personId,
        );
        if (!enabledEmailAddress) {
            return this.logger.error(
                `[EventID: ${event.eventID}] Person with ID ${event.personId} has no enabled EmailAddress!`,
            );
        }

        const disabledEmailAddressesSorted: EmailAddress<true>[] =
            await this.emailRepo.findByPersonSortedByUpdatedAtDesc(event.personId, EmailAddressStatus.DISABLED);
        if (disabledEmailAddressesSorted.length === 0) {
            this.logger.info(
                `[EventID: ${event.eventID}] No disabled EmailAddress(es) for Person with ID ${event.personId}.`,
            );
        }

        const givenName: string = person.vorname;
        const surName: string = person.familienname;
        const cn: string = person.referrer;
        const mailPrimaryAddress: string = enabledEmailAddress.address;
        //const mailAlternativeAddress: string = ;
    }
}
