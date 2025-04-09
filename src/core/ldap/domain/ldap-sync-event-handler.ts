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
import { LdapGroupKennungExtractionError } from '../error/ldap-group-kennung-extraction.error.js';
import { OrganisationsTyp } from '../../../modules/organisation/domain/organisation.enums.js';
import { PersonLdapSyncEvent } from '../../../shared/events/person-ldap-sync.event.js';

export type LdapSyncData = {
    givenName: string;
    surName: string;
    cn: string;
    enabledEmailAddress: string;
    disabledEmailAddresses: string[];

    personId: PersonID;
    referrer: string;
    groupsToAdd: string[];
    groupsToRemove: string[];
};

/**
 * Handling of PersonExternalSystemsSyncEvent is done here, an additional class next to LdapEventHandler
 * for several reasons: maybe settings of features in here should be configurable in the future in contrast to LdapEventHandler (and reduce refactoring),
 * more processing logic is done in here, in contrast the LdapEventHandler passes the parameters to LdapClientService
 * and in the end this handler also shares some common data and common behavior with ItsLearningSyncEventHandler.
 */
@Injectable()
export class LdapSyncEventHandler {
    public static readonly GROUP_DN_REGEX_STR: string = `cn=lehrer-KENNUNG1,cn=groups,ou=KENNUNG2,dc=schule-sh,dc=de`;

    public static readonly GROUP_DN_REGEX: RegExp = /cn=lehrer-\d+,cn=groups,ou=\d+,dc=schule-sh,dc=de/;

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

        await this.fetchDataAndSync(event.personId);
    }

    /**
     * This event-handler-method is implemented to make fetchDataAndSync() callable indirectly and also avoid the usage without await.
     * Otherwise, method calls to fetchDataAndSync() had to be possible without await and would force usage floating-promises.
     **/
    @EventHandler(PersonLdapSyncEvent)
    public async personLdapSyncEventHandler(event: PersonLdapSyncEvent): Promise<void> {
        this.logger.info(`[EventID: ${event.eventID}] Received PersonLdapSyncEvent, personId:${event.personId}`);

        await this.fetchDataAndSync(event.personId);
    }

    public async triggerLdapSync(personId: PersonID): Promise<void> {
        await this.fetchDataAndSync(personId);
    }

    private async fetchDataAndSync(personId: PersonID): Promise<void> {
        // Retrieve the person from the DB
        const person: Option<Person<true>> = await this.personRepository.findById(personId);
        if (!person) {
            return this.logger.error(`Person with personId:${personId} could not be found!`);
        }

        // Check if person has a username
        if (!person.referrer) {
            return this.logger.error(`Person with personId:${personId} has no username!`);
        }

        // Check person has active, primary EmailAddress
        const enabledEmailAddress: Option<EmailAddress<true>> = await this.emailRepo.findEnabledByPerson(personId);
        if (!enabledEmailAddress) {
            return this.logger.error(`Person with personId:${personId} has no enabled EmailAddress!`);
        }

        // Search for most recent deactivated EmailAddress
        const disabledEmailAddressesSorted: EmailAddress<true>[] =
            await this.emailRepo.findByPersonSortedByUpdatedAtDesc(personId, EmailAddressStatus.DISABLED);
        if (disabledEmailAddressesSorted.length === 0) {
            this.logger.info(`No DISABLED EmailAddress(es) for Person with ID ${personId}`);
        }

        // Get all PKs
        const kontexte: Personenkontext<true>[] = await this.dBiamPersonenkontextRepo.findByPerson(personId);

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

        let emailDomain: Option<string> = null;
        // Delete all organisations from map which are NOT typ SCHULE
        for (const [orgaId, orga] of organisations.entries()) {
            if (orga.typ !== OrganisationsTyp.SCHULE) {
                organisations.delete(orgaId);
            }
        }
        // checking emailDomain for only the first organisation is sufficient, tree can only consist of either OeffentlicheSchulen or ErsatzSchulen.
        if (!organisationIDs[0]) {
            return this.logger.error(
                `Could NOT fetch domain from organisations, no organisations found for person, ABORTING SYNC, personId:${personId}`,
            );
        }
        emailDomain = await this.organisationRepository.findEmailDomainForOrganisation(organisationIDs[0]);
        if (!emailDomain) {
            return this.logger.error(
                `Could NOT fetch domain from organisations, LDAP-root CANNOT be chosen, ABORTING SYNC, personId:${personId}`,
            );
        }

        // Filter PKs for the remaining rollen with rollenArt LEHR and the remaining organisations with typ SCHULE
        const pksWithRollenArtLehrAndOrganisationSchule: Personenkontext<true>[] = kontexte.filter(
            (pk: Personenkontext<true>) => rollen.has(pk.rolleId) && organisations.has(pk.organisationId),
        );

        const schulenDstNrList: string[] = [];
        let schule: Organisation<true> | undefined;
        for (const pk of pksWithRollenArtLehrAndOrganisationSchule) {
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
            `Found orgaKennungen:${JSON.stringify(schulenDstNrList)}, for personId:${personId}, referrer:${person.referrer}`,
        );

        // Get current attributes for person from LDAP
        const personAttributes: Result<LdapPersonAttributes> = await this.ldapClientService.getPersonAttributes(
            personId,
            person.referrer,
            emailDomain,
        );
        if (!personAttributes.ok) {
            return this.logger.error(
                `Error while fetching attributes for personId:${personId} in LDAP, msg:${personAttributes.error.message}`,
            );
        }
        // entryUUID is only return within LdapPersonAttributes, when an empty PersonEntry had to be created,
        // therefore changed data has to be persisted via repository
        if (personAttributes.value.entryUUID) {
            person.externalIds.LDAP = personAttributes.value.entryUUID;
            await this.personRepository.save(person);
        }

        const givenName: string = person.vorname;
        const surName: string = person.familienname;
        const cn: string = person.referrer;
        const mailPrimaryAddress: string = enabledEmailAddress.address;
        const mailAlternativeAddresses: string[] = disabledEmailAddressesSorted.map(
            (ea: EmailAddress<true>) => ea.address,
        );

        // Get current groups for person from LDAP
        const groups: Result<string[]> = await this.ldapClientService.getGroupsForPerson(personId, person.referrer);
        if (!groups.ok) {
            return this.logger.error(
                `Error while fetching groups for personId:${personId} in LDAP, msg:${groups.error.message}`,
            );
        }
        this.logger.info(
            `Found groups in LDAP:${JSON.stringify(groups.value)}, for personId:${personId}, referrer:${person.referrer}`,
        );

        const groupsToAdd: string[] = this.createGroupAdditionList(schulenDstNrList, groups.value);
        const groupsToRemove: string[] = this.createGroupRemovalList(schulenDstNrList, groups.value);

        const syncData: LdapSyncData = {
            personId: person.id,
            referrer: person.referrer,
            givenName: givenName,
            surName: surName,
            cn: cn,
            enabledEmailAddress: mailPrimaryAddress,
            disabledEmailAddresses: mailAlternativeAddresses,
            groupsToAdd: groupsToAdd,
            groupsToRemove: groupsToRemove,
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

        await Promise.all([
            ldapSyncData.groupsToAdd.map((kennung: string) =>
                this.ldapClientService.addPersonToGroup(ldapSyncData.referrer, kennung, personAttributes.dn),
            ),
            ldapSyncData.groupsToRemove.map((kennung: string) =>
                this.ldapClientService.removePersonFromGroup(ldapSyncData.referrer, kennung, personAttributes.dn),
            ),
        ]);
    }

    private isAddressInDisabledAddresses(email: string, disabledEmailAddresses: string[]): boolean {
        return disabledEmailAddresses.some((disabledAddress: string) => disabledAddress === email);
    }

    private createGroupAdditionList(schulenDstNrList: string[], groupDns: string[]): string[] {
        const groupsToAdd: string[] = [];
        for (const schulenDstNr of schulenDstNrList) {
            if (!groupDns.some((groupDn: string) => groupDn.includes(schulenDstNr))) {
                this.logger.warning(`Added missing groupMembership for kennung:${schulenDstNr}`);
                groupsToAdd.push(schulenDstNr);
            }
        }
        return groupsToAdd;
    }

    private createGroupRemovalList(schulenDstNrList: string[], groupDns: string[]): string[] {
        const groupsToRemove: string[] = [];
        for (const groupDn of groupDns) {
            if (!schulenDstNrList.some((schulenDstNr: string) => this.isGroupDnForKennung(groupDn, schulenDstNr))) {
                this.logger.warning(`Orphan group detected, no existing PK for groupDN:${groupDn}`);
                const kennungFromGroupDn: Result<string> = this.getKennungFromGroupDn(groupDn);
                if (!kennungFromGroupDn.ok) {
                    this.logger.error(
                        `Could NOT extract kennung from groupDN:${groupDn}, CANNOT add group to list of groups for removal, err:${kennungFromGroupDn.error.message}`,
                    );
                } else {
                    groupsToRemove.push(kennungFromGroupDn.value);
                }
            }
        }
        return groupsToRemove;
    }

    private isGroupDnForKennung(groupDn: string, kennung: string): boolean {
        const rep: string = LdapSyncEventHandler.GROUP_DN_REGEX_STR.replace('KENNUNG1', kennung).replace(
            'KENNUNG2',
            kennung,
        );
        return groupDn === rep;
    }

    private getKennungFromGroupDn(groupDn: string): Result<string> {
        const split: string[] = groupDn.split(',cn=groups,');

        if (!split[0] || !split[0].match(/cn=lehrer-\d+/)) {
            return {
                ok: false,
                error: new LdapGroupKennungExtractionError('Split on ,cn=groups, failed'),
            };
        }

        return {
            ok: true,
            value: split[0].replace('cn=lehrer-', ''),
        };
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
