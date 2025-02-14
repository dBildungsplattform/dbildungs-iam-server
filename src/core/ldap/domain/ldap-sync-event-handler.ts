import { Injectable } from '@nestjs/common';
import { LdapClientService, LdapPersonAttributes } from './ldap-client.service.js';
import { ClassLogger } from '../../logging/class-logger.js';
import { EventHandler } from '../../eventbus/decorators/event-handler.decorator.js';
import { PersonExternalSystemsSyncEvent } from '../../../shared/events/person-external-systems-sync.event.js';
import { Person } from '../../../modules/person/domain/person.js';
import { PersonRepository } from '../../../modules/person/persistence/person.repository.js';
import { EmailRepo } from '../../../modules/email/persistence/email.repo.js';
import { EmailAddress, EmailAddressStatus } from '../../../modules/email/domain/email-address.js';
import { OrganisationID, PersonID, PersonReferrer, RolleID } from '../../../shared/types/aggregate-ids.types.js';
import { DomainError } from '../../../shared/error/domain.error.js';
import { Personenkontext } from '../../../modules/personenkontext/domain/personenkontext.js';
import { uniq } from 'lodash-es';
import { Rolle } from '../../../modules/rolle/domain/rolle.js';
import { Organisation } from '../../../modules/organisation/domain/organisation.js';
import { DBiamPersonenkontextRepo } from '../../../modules/personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RolleRepo } from '../../../modules/rolle/repo/rolle.repo.js';
import { OrganisationRepository } from '../../../modules/organisation/persistence/organisation.repository.js';
import { RollenArt } from '../../../modules/rolle/domain/rolle.enums.js';

export type LdapSyncData = {
    givenName: string;
    surName: string;
    cn: string;
    enabledEmailAddress: string;
    disabledEmailAddresses: string[];

    personId: PersonID;
    referrer: string;
    //groupOuList: string[];
};

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
        private readonly dBiamPersonenkontextRepo: DBiamPersonenkontextRepo,
        private readonly rolleRepo: RolleRepo,
        private readonly organisationRepository: OrganisationRepository,
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
                `[EventID: ${event.eventID}] No DISABLED EmailAddress(es) for Person with ID ${event.personId}`,
            );
        }

        // Get all PKs
        const kontexte: Personenkontext<true>[] = await this.dBiamPersonenkontextRepo.findByPerson(event.personId);

        // Find all rollen and organisations
        const rollenIDs: RolleID[] = uniq(kontexte.map((pk: Personenkontext<true>) => pk.rolleId));
        const organisationIDs: OrganisationID[] = uniq(kontexte.map((pk: Personenkontext<true>) => pk.organisationId));
        const [rollen, organisations]: [Map<RolleID, Rolle<true>>, Map<OrganisationID, Organisation<true>>] =
            await Promise.all([
                this.rolleRepo.findByIds(rollenIDs),
                this.organisationRepository.findByIds(organisationIDs),
            ]);

        // Delete all rollen from map which are NOT LEHR
        for (const [rolleId, rolle] of rollen.entries()) {
            if (rolle.rollenart !== RollenArt.LEHR) {
                rollen.delete(rolleId);
            }
        }

        // Filter PKs for the remaining rollen with rollenArt LEHR
        const pksWithRollenArtLehr: Personenkontext<true>[] = kontexte.filter((pk: Personenkontext<true>) =>
            rollen.has(pk.rolleId),
        );

        const schulenDstNrList: string[] = [];
        let schule: Organisation<true> | undefined;
        for (const pk of pksWithRollenArtLehr) {
            schule = organisations.get(pk.organisationId);
            if (!schule) {
                return this.logger.error(`Could not find organisation, orgaId:${pk.organisationId}, pkId:${pk.id}`);
            }
            if (!schule.kennung) {
                return this.logger.error(
                    `Required kennung is missing on organisation, orgaId:${pk.organisationId}, pkId:${pk.id}`,
                );
            }
            schulenDstNrList.push(schule.kennung);
        }
        this.logger.info(
            `Found orgaKennungen:${JSON.stringify(schulenDstNrList)}, for personId:${event.personId}, referrer:${person.referrer}`,
        );

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
        const mailAlternativeAddresses: string[] = disabledEmailAddressesSorted.map(
            (ea: EmailAddress<true>) => ea.address,
        );

        // Get current groups for person from LDAP
        const groups: Result<string[]> = await this.ldapClientService.getGroupsForPerson(
            event.personId,
            person.referrer,
        );
        if (!groups.ok) {
            return this.logger.error(
                `[EventID: ${event.eventID}] Error while fetching groups for person in LDAP, msg:${groups.error.message}`,
            );
        }
        this.logger.info(
            `Found groups in LDAP:${JSON.stringify(groups.value)}, for personId:${event.personId}, referrer:${person.referrer}`,
        );

        const syncData: LdapSyncData = {
            personId: person.id,
            referrer: person.referrer,
            givenName: givenName,
            surName: surName,
            cn: cn,
            enabledEmailAddress: mailPrimaryAddress,
            disabledEmailAddresses: mailAlternativeAddresses,
        };

        await this.syncDataToLdap(syncData, personAttributes.value);
    }

    private async syncDataToLdap(ldapSyncData: LdapSyncData, personAttributes: LdapPersonAttributes): Promise<void> {
        this.logger.info(
            `Syncing data to LDAP for personId:${ldapSyncData.personId}, referrer:${ldapSyncData.referrer}`,
        );
        // Check and sync EmailAddress
        const currentMailPrimaryAddress: string | undefined = personAttributes.mailPrimaryAddress;
        if (ldapSyncData.enabledEmailAddress !== currentMailPrimaryAddress) {
            this.logger.warning(
                `Mismatch mailPrimaryAddress, person:${ldapSyncData.enabledEmailAddress}, LDAP:${currentMailPrimaryAddress}, personId:${ldapSyncData.personId}, referrer:${ldapSyncData.referrer}`,
            );
            if (!currentMailPrimaryAddress) {
                this.logger.warning(
                    `MailPrimaryAddress undefined for personId:${ldapSyncData.personId}, referrer:${ldapSyncData.referrer}`,
                );
                await this.ldapClientService.changeEmailAddressByPersonId(
                    ldapSyncData.personId,
                    ldapSyncData.referrer,
                    ldapSyncData.enabledEmailAddress,
                );
            } else {
                if (this.isAddressInDisabledAddresses(currentMailPrimaryAddress, ldapSyncData.disabledEmailAddresses)) {
                    this.logger.info(
                        `Found ${currentMailPrimaryAddress} in DISABLED addresses, personId:${ldapSyncData.personId}, referrer:${ldapSyncData.referrer}`,
                    );
                    this.logger.info(
                        `Overwriting LDAP:${currentMailPrimaryAddress} with person:${ldapSyncData.enabledEmailAddress}, personId:${ldapSyncData.personId}, referrer:${ldapSyncData.referrer}`,
                    );
                    await this.ldapClientService.changeEmailAddressByPersonId(
                        ldapSyncData.personId,
                        ldapSyncData.referrer,
                        ldapSyncData.enabledEmailAddress,
                    );
                    if (personAttributes.mailAlternativeAddress) {
                        await this.createDisabledEmailAddress(
                            ldapSyncData.personId,
                            ldapSyncData.referrer,
                            personAttributes.mailAlternativeAddress,
                        );
                    }
                } else {
                    return this.logger.crit(
                        `COULD NOT find ${currentMailPrimaryAddress} in DISABLED addresses, Overwriting ABORTED, personId:${ldapSyncData.personId}, referrer:${ldapSyncData.referrer}`,
                    );
                }
            }
        }

        // Check and sync PersonAttributes
        if (ldapSyncData.givenName !== personAttributes.givenName) {
            this.logger.warning(
                `Mismatch for givenName, person:${ldapSyncData.givenName}, LDAP:${personAttributes.givenName}, personId:${ldapSyncData.personId}, referrer:${ldapSyncData.referrer}`,
            );
        }
        if (ldapSyncData.surName !== personAttributes.surName) {
            this.logger.warning(
                `Mismatch for surName, person:${ldapSyncData.surName}, LDAP:${personAttributes.surName}, personId:${ldapSyncData.personId}, referrer:${ldapSyncData.referrer}`,
            );
        }
        if (ldapSyncData.cn !== personAttributes.cn) {
            this.logger.warning(
                `Mismatch for cn, person:${ldapSyncData.cn}, LDAP:${personAttributes.cn}, personId:${ldapSyncData.personId}, referrer:${ldapSyncData.referrer}`,
            );
        }

        await this.ldapClientService.modifyPersonAttributes(
            ldapSyncData.referrer,
            ldapSyncData.givenName,
            ldapSyncData.surName,
            ldapSyncData.cn,
        );
    }

    private isAddressInDisabledAddresses(email: string, disabledEmailAddresses: string[]): boolean {
        return disabledEmailAddresses.some((disabledAddress: string) => disabledAddress === email);
    }

    private async createDisabledEmailAddress(
        personId: PersonID,
        referrer: PersonReferrer,
        address: string,
    ): Promise<void> {
        const email: EmailAddress<false> = EmailAddress.createNew(
            personId,
            address,
            EmailAddressStatus.DISABLED,
            undefined,
        );

        const persistenceResult: EmailAddress<true> | DomainError = await this.emailRepo.save(email);
        if (persistenceResult instanceof EmailAddress) {
            this.logger.info(
                `Successfully persisted new DISABLED EmailAddress for address:${persistenceResult.address}, personId:${personId}, referrer:${referrer}`,
            );
            //* NO EVENT IS PUBLISHED HERE -> NO COMMUNICATION TO OX */
        } else {
            this.logger.error(
                `Could not persist email for personId:${personId}, referrer:${referrer}, error:${persistenceResult.message}`,
            );
        }
    }
}
