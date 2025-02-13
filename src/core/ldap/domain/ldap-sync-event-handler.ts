import { Injectable } from '@nestjs/common';
import { LdapClientService, LdapPersonAttributes, LdapSyncData } from './ldap-client.service.js';
import { ClassLogger } from '../../logging/class-logger.js';
//import { OrganisationRepository } from '../../../modules/organisation/persistence/organisation.repository.js';
import { EventHandler } from '../../eventbus/decorators/event-handler.decorator.js';
import { PersonExternalSystemsSyncEvent } from '../../../shared/events/person-external-systems-sync.event.js';
import { Person } from '../../../modules/person/domain/person.js';
import { PersonRepository } from '../../../modules/person/persistence/person.repository.js';
import { EmailRepo } from '../../../modules/email/persistence/email.repo.js';
import { EmailAddress, EmailAddressStatus } from '../../../modules/email/domain/email-address.js';

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
        //private readonly organisationRepository: OrganisationRepository,
        private readonly emailRepo: EmailRepo,
    ) {}

    @EventHandler(PersonExternalSystemsSyncEvent)
    public async personExternalSystemSyncEventHandler(event: PersonExternalSystemsSyncEvent): Promise<void> {
        this.logger.info(
            `[EventID: ${event.eventID}] Received PersonExternalSystemsSyncEvent, personId:${event.personId}`,
        );

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

        // Check person has active, primary EmailAddress
        const enabledEmailAddress: Option<EmailAddress<true>> = await this.emailRepo.findEnabledByPerson(
            event.personId,
        );
        if (!enabledEmailAddress) {
            return this.logger.error(
                `[EventID: ${event.eventID}] Person with ID ${event.personId} has no enabled EmailAddress!`,
            );
        }

        // Search for most recent deactivated EmailAddress
        const disabledEmailAddressesSorted: EmailAddress<true>[] =
            await this.emailRepo.findByPersonSortedByUpdatedAtDesc(event.personId, EmailAddressStatus.DISABLED);
        if (disabledEmailAddressesSorted.length === 0) {
            this.logger.info(
                `[EventID: ${event.eventID}] No disabled EmailAddress(es) for Person with ID ${event.personId}.`,
            );
        }

        // Get current attributes for person from LDAP
        const personAttributes: Result<LdapPersonAttributes> = await this.ldapClientService.getPersonAttributes(
            event.personId,
            person.referrer,
        );
        if (!personAttributes.ok) {
            return this.logger.error(
                `[EventID: ${event.eventID}] Error while fetching attributes for person in LDAP, msg:${personAttributes.error.message}`,
            );
        }

        const givenName: string = person.vorname;
        const surName: string = person.familienname;
        const cn: string = person.referrer;
        const mailPrimaryAddress: string = enabledEmailAddress.address;
        const mailAlternativeAddress: string = disabledEmailAddressesSorted[0]?.address ?? '';

        const syncData: LdapSyncData = {
            personId: person.id,
            referrer: person.referrer,
            givenName: givenName,
            surName: surName,
            cn: cn,
            mailPrimaryAddress: mailPrimaryAddress,
            mailAlternativeAddress: mailAlternativeAddress,
        };

        await this.syncDataToLdap(syncData, personAttributes.value);
    }

    private async syncDataToLdap(ldapSyncData: LdapSyncData, personAttributes: LdapPersonAttributes): Promise<void> {
        // Check and sync EmailAddress
        const currentMailPrimaryAddress: string | undefined = personAttributes.mailPrimaryAddress;
        if (ldapSyncData.mailPrimaryAddress !== currentMailPrimaryAddress) {
            this.logger.info(
                `Overwriting mailPrimaryAddress:${currentMailPrimaryAddress} in LDAP with ${ldapSyncData.mailPrimaryAddress}`,
            );
            await this.ldapClientService.changeEmailAddressByPersonId(
                ldapSyncData.personId,
                ldapSyncData.referrer,
                ldapSyncData.mailPrimaryAddress,
            );
        }

        // Check and sync PersonAttributes
        if (ldapSyncData.givenName !== personAttributes.givenName) {
            this.logger.error(
                `Mismatch for givenName, person:${ldapSyncData.givenName}, LDAP:${personAttributes.givenName}`,
            );
        }
        if (ldapSyncData.surName !== personAttributes.surName) {
            this.logger.error(`Mismatch for surName, person:${ldapSyncData.surName}, LDAP:${personAttributes.surName}`);
        }
        if (ldapSyncData.cn !== personAttributes.cn) {
            this.logger.error(`Mismatch for cn, person:${ldapSyncData.cn}, LDAP:${personAttributes.cn}`);
        }
        if (ldapSyncData.mailPrimaryAddress !== personAttributes.mailPrimaryAddress) {
            this.logger.error(
                `Mismatch for mailPrimaryAddress, person:${ldapSyncData.mailPrimaryAddress}, LDAP:${personAttributes.mailPrimaryAddress}`,
            );
        }
        if (ldapSyncData.mailAlternativeAddress !== personAttributes.mailAlternativeAddress) {
            this.logger.error(
                `Mismatch for mailAlternativeAddress, person:${ldapSyncData.mailAlternativeAddress}, LDAP:${personAttributes.mailAlternativeAddress}`,
            );
        }

        this.logger.info(
            `Overwriting mailPrimaryAddress:${currentMailPrimaryAddress} in LDAP with ${ldapSyncData.mailPrimaryAddress}`,
        );
        await this.ldapClientService.modifyPersonAttributes(
            ldapSyncData.referrer,
            ldapSyncData.givenName,
            ldapSyncData.surName,
            ldapSyncData.cn,
        );
    }
}
