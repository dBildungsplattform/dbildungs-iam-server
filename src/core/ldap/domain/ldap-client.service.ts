import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../logging/class-logger.js';
import { Attribute, Change, Client, Control, Entry, SearchResult } from 'ldapts';
import { LdapEntityType, LdapPersonEntry } from './ldap.types.js';
import { LdapClient } from './ldap-client.js';
import { LdapInstanceConfig } from '../ldap-instance-config.js';
import { UsernameRequiredError } from '../../../modules/person/domain/username-required.error.js';
import { Mutex } from 'async-mutex';
import { LdapSearchError } from '../error/ldap-search.error.js';
import { OrganisationKennung, PersonID, PersonReferrer } from '../../../shared/types/aggregate-ids.types.js';
import { EventService } from '../../eventbus/services/event.service.js';
import { LdapPersonEntryChangedEvent } from '../../../shared/events/ldap-person-entry-changed.event.js';
import { LdapEmailAddressError } from '../error/ldap-email-address.error.js';
import { LdapEmailDomainError } from '../error/ldap-email-domain.error.js';
import { LdapCreateLehrerError } from '../error/ldap-create-lehrer.error.js';
import { LdapModifyEmailError } from '../error/ldap-modify-email.error.js';
import { LdapModifyUserPasswordError } from '../error/ldap-modify-user-password.error.js';
import { generatePassword } from '../../../shared/util/password-generator.js';
import { LdapAddPersonToGroupError } from '../error/ldap-add-person-to-group.error.js';
import { LdapRemovePersonFromGroupError } from '../error/ldap-remove-person-from-group.error.js';
import { LdapFetchAttributeError } from '../error/ldap-fetch-attribute.error.js';

export type LdapPersonAttributes = {
    givenName: string;
    surName: string;
    cn: string;
    mailPrimaryAddress?: string;
    mailAlternativeAddress?: string;
};

export type PersonData = {
    vorname: string;
    familienname: string;
    id: string;
    referrer?: string;
    ldapEntryUUID?: string; // When this field is set, it will use the relax operator. Only use during migration.
};

@Injectable()
export class LdapClientService {
    public static readonly DEFAULT_RETRIES: number = 3; // e.g. DEFAULT_RETRIES = 3 will produce retry sequence: 1sek, 8sek, 27sek (1000ms * retrycounter^3)

    public static readonly OEFFENTLICHE_SCHULEN_DOMAIN_DEFAULT: string = 'schule-sh.de';

    public static readonly ERSATZ_SCHULEN_DOMAIN_DEFAULT: string = 'ersatzschule-sh.de';

    public static readonly OEFFENTLICHE_SCHULEN_OU: string = 'oeffentlicheSchulen';

    public static readonly ERSATZ_SCHULEN_OU: string = 'ersatzSchulen';

    public static readonly GIVEN_NAME: string = 'givenName';

    public static readonly SUR_NAME: string = 'sn';

    public static readonly COMMON_NAME: string = 'cn';

    public static readonly MAIL_PRIMARY_ADDRESS: string = 'mailPrimaryAddress';

    public static readonly MAIL_ALTERNATIVE_ADDRESS: string = 'mailAlternativeAddress';

    public static readonly USER_PASSWORD: string = 'userPassword';

    public static readonly DC_SCHULE_SH_DC_DE: string = 'dc=schule-sh,dc=de';

    public static readonly GID_NUMBER: string = '100'; //because 0 to 99 are used for statically allocated user groups on Unix-systems

    public static readonly UID_NUMBER: string = '100'; //to match the GID_NUMBER rule above and 0 is reserved for super-user

    public static readonly HOME_DIRECTORY: string = 'none'; //highlight it's a dummy value

    private static readonly RELAX_OID: string = '1.3.6.1.4.1.4203.666.5.12'; // Relax Control

    private static readonly GROUPS: string = 'groups';

    private mutex: Mutex;

    public constructor(
        private readonly ldapClient: LdapClient,
        private readonly ldapInstanceConfig: LdapInstanceConfig,
        private readonly logger: ClassLogger,
        private readonly eventService: EventService,
    ) {
        this.mutex = new Mutex();
    }

    //** BELOW ONLY PUBLIC FUNCTIONS - MUST USE THE 'executeWithRetry' WRAPPER TO HAVE STRONG FAULT TOLERANCE*/

    public async createLehrer(
        person: PersonData,
        domain: string,
        schulId: string,
        mail?: string,
    ): Promise<Result<PersonData>> {
        return this.executeWithRetry(
            () => this.createLehrerInternal(person, domain, schulId, mail),
            LdapClientService.DEFAULT_RETRIES,
        );
    }

    public async isLehrerExisting(referrer: PersonReferrer, domain: string): Promise<Result<boolean>> {
        return this.executeWithRetry(
            () => this.isLehrerExistingInternal(referrer, domain),
            LdapClientService.DEFAULT_RETRIES,
        );
    }

    public async modifyPersonAttributes(
        oldReferrer: PersonReferrer,
        newGivenName?: string,
        newSn?: string,
        newReferrer?: PersonReferrer,
    ): Promise<Result<string>> {
        return this.executeWithRetry(
            () => this.modifyPersonAttributesInternal(oldReferrer, newGivenName, newSn, newReferrer),
            LdapClientService.DEFAULT_RETRIES,
        );
    }

    public async getPersonAttributes(
        personId: PersonID,
        referrer: PersonReferrer,
    ): Promise<Result<LdapPersonAttributes>> {
        return this.executeWithRetry(
            () => this.getPersonAttributesInternal(personId, referrer),
            LdapClientService.DEFAULT_RETRIES,
        );
    }

    public async getGroupsForPerson(personId: PersonID, referrer: PersonReferrer): Promise<Result<string[]>> {
        return this.executeWithRetry(
            () => this.getGroupsForPersonInternal(personId, referrer),
            LdapClientService.DEFAULT_RETRIES,
        );
    }

    public async updateMemberDnInGroups(
        oldReferrer: PersonReferrer,
        newReferrer: PersonReferrer,
        oldUid: string,
        client: Client,
    ): Promise<Result<string>> {
        return this.executeWithRetry(
            () => this.updateMemberDnInGroupsInternal(oldReferrer, newReferrer, oldUid, client),
            LdapClientService.DEFAULT_RETRIES,
        );
    }

    public async deleteLehrerByReferrer(referrer: PersonReferrer): Promise<Result<string>> {
        return this.executeWithRetry(
            () => this.deleteLehrerByReferrerInternal(referrer),
            LdapClientService.DEFAULT_RETRIES,
        );
    }

    public async deleteLehrer(
        person: PersonData,
        orgaKennung: OrganisationKennung,
        domain: string,
    ): Promise<Result<PersonData>> {
        return this.executeWithRetry(
            () => this.deleteLehrerInternal(person, orgaKennung, domain),
            LdapClientService.DEFAULT_RETRIES,
        );
    }

    public async addPersonToGroup(
        personUid: string,
        orgaKennung: OrganisationKennung,
        lehrerUid: string,
    ): Promise<Result<boolean>> {
        return this.executeWithRetry(
            () => this.addPersonToGroupInternal(personUid, orgaKennung, lehrerUid),
            LdapClientService.DEFAULT_RETRIES,
        );
    }

    public async changeEmailAddressByPersonId(
        personId: PersonID,
        referrer: PersonReferrer,
        newEmailAddress: string,
    ): Promise<Result<PersonID>> {
        return this.executeWithRetry(
            () => this.changeEmailAddressByPersonIdInternal(personId, referrer, newEmailAddress),
            LdapClientService.DEFAULT_RETRIES,
        );
    }

    public async removePersonFromGroup(
        referrer: PersonReferrer,
        orgaKennung: OrganisationKennung,
        lehrerUid: string,
    ): Promise<Result<boolean>> {
        return this.executeWithRetry(
            () => this.removePersonFromGroupInternal(referrer, orgaKennung, lehrerUid),
            LdapClientService.DEFAULT_RETRIES,
        );
    }

    public async removePersonFromGroupByUsernameAndKennung(
        referrer: PersonReferrer,
        orgaKennung: OrganisationKennung,
        domain: string,
    ): Promise<Result<boolean>> {
        const rootName: Result<string> = this.getRootNameOrError(domain);
        if (!rootName.ok) return rootName;

        const lehrerUid: string = this.getLehrerUid(referrer, rootName.value);

        return this.removePersonFromGroup(referrer, orgaKennung, lehrerUid);
    }

    public async changeUserPasswordByPersonId(personId: PersonID, referrer: PersonReferrer): Promise<Result<PersonID>> {
        return this.executeWithRetry(
            () => this.changeUserPasswordByPersonIdInternal(personId, referrer),
            LdapClientService.DEFAULT_RETRIES,
        );
    }

    //** BELOW ONLY PUBLIC HELPER FUNCTIONS THAT NOT OPERATE ON LDAP - MUST NOT USE THE 'executeWithRetry'/

    public createNewLehrerUidFromOldUid(oldUid: string, newReferrer: PersonReferrer): string {
        const splitted: string[] = oldUid.split(',');
        splitted[0] = `uid=${newReferrer}`;
        return splitted.join(',');
    }

    //** BELOW ONLY PRIVATE FUNCTIONS - MUST USE THE 'executeWithRetry' WRAPPER TO HAVE STRONG FAULT TOLERANCE*/

    private async bind(): Promise<Result<boolean>> {
        this.logger.info('LDAP: bind');
        try {
            await this.ldapClient
                .getClient()
                .bind(this.ldapInstanceConfig.BIND_DN, this.ldapInstanceConfig.ADMIN_PASSWORD);
            this.logger.info('LDAP: Successfully connected');
            return {
                ok: true,
                value: true,
            };
        } catch (err) {
            const errMsg: string = `Could not connect to LDAP, message: ${JSON.stringify(err)}`;
            this.logger.error(errMsg);
            return { ok: false, error: new Error(errMsg) };
        }
    }

    private getRootName(emailDomain: string): Result<string, LdapEmailDomainError> {
        if (
            emailDomain === this.ldapInstanceConfig.ERSATZSCHULEN_DOMAIN ||
            emailDomain === LdapClientService.ERSATZ_SCHULEN_DOMAIN_DEFAULT
        )
            return {
                ok: true,
                value: LdapClientService.ERSATZ_SCHULEN_OU,
            };
        if (
            emailDomain === this.ldapInstanceConfig.OEFFENTLICHE_SCHULEN_DOMAIN ||
            emailDomain === LdapClientService.OEFFENTLICHE_SCHULEN_DOMAIN_DEFAULT
        )
            return {
                ok: true,
                value: LdapClientService.OEFFENTLICHE_SCHULEN_OU,
            };

        return {
            ok: false,
            error: new LdapEmailDomainError(),
        };
    }

    private getLehrerUid(referrer: PersonReferrer, rootName: string): string {
        return `uid=${referrer},ou=${rootName},${this.ldapInstanceConfig.BASE_DN}`;
    }

    private getRootNameOrError(domain: string): Result<string> {
        const rootName: Result<string> = this.getRootName(domain);
        if (!rootName.ok) {
            this.logger.error(`Could not get root-name because email-domain is invalid, domain:${domain}`);
        }
        return rootName;
    }

    private async createLehrerInternal(
        person: PersonData,
        domain: string,
        schulId: string,
        mail?: string, //Wird hier erstmal seperat mit reingegeben bis die Umstellung auf primary/alternative erfolgt
    ): Promise<Result<PersonData>> {
        const referrer: PersonReferrer | undefined = person.referrer;
        if (!referrer) {
            return {
                ok: false,
                error: new UsernameRequiredError(
                    `Lehrer ${person.vorname} ${person.familienname} does not have a username`,
                ),
            };
        }
        const rootName: Result<string> = this.getRootNameOrError(domain);
        if (!rootName.ok) return rootName;

        const lehrerUid: string = this.getLehrerUid(referrer, rootName.value);
        return this.mutex.runExclusive(async () => {
            this.logger.info('LDAP: createLehrer');
            const client: Client = this.ldapClient.getClient();
            const bindResult: Result<boolean> = await this.bind();
            if (!bindResult.ok) return bindResult;

            const groupResult: Result<boolean, Error> = await this.addPersonToGroup(referrer, schulId, lehrerUid);
            if (!groupResult.ok) {
                this.logger.error(`LDAP: Failed to add lehrer ${referrer} to group lehrer-${schulId}`);
                return groupResult;
            }

            const searchResultLehrer: SearchResult = await client.search(
                `ou=${rootName.value},${this.ldapInstanceConfig.BASE_DN}`,
                {
                    filter: `(uid=${person.referrer})`,
                },
            );
            if (searchResultLehrer.searchEntries.length > 0) {
                this.logger.info(`LDAP: Lehrer ${lehrerUid} exists, nothing to create`);

                return { ok: true, value: person };
            }
            const entry: LdapPersonEntry = {
                uid: referrer,
                uidNumber: LdapClientService.UID_NUMBER,
                gidNumber: LdapClientService.GID_NUMBER,
                homeDirectory: LdapClientService.HOME_DIRECTORY,
                cn: referrer,
                givenName: person.vorname,
                sn: person.familienname,
                objectclass: ['inetOrgPerson', 'univentionMail', 'posixAccount'],
                mailPrimaryAddress: mail ?? ``,
                mailAlternativeAddress: mail ?? ``,
            };

            const controls: Control[] = [];
            if (person.ldapEntryUUID) {
                entry.entryUUID = person.ldapEntryUUID;
                controls.push(new Control(LdapClientService.RELAX_OID));
            }

            try {
                await client.add(lehrerUid, entry, controls);
                this.logger.info(`LDAP: Successfully created lehrer ${lehrerUid}`);

                return { ok: true, value: person };
            } catch (err) {
                const errMsg: string = JSON.stringify(err);
                this.logger.error(`LDAP: Creating lehrer FAILED, uid:${lehrerUid}, errMsg:${errMsg}`);
                return { ok: false, error: new LdapCreateLehrerError() };
            }
        });
    }

    private async isLehrerExistingInternal(referrer: PersonReferrer, domain: string): Promise<Result<boolean>> {
        const rootName: Result<string> = this.getRootNameOrError(domain);
        if (!rootName.ok) return rootName;

        return this.mutex.runExclusive(async () => {
            this.logger.info('LDAP: isLehrerExisting');
            const client: Client = this.ldapClient.getClient();
            const bindResult: Result<boolean> = await this.bind();
            if (!bindResult.ok) return bindResult;

            const searchResultLehrer: SearchResult = await client.search(
                `ou=${rootName.value},${this.ldapInstanceConfig.BASE_DN}`,
                {
                    filter: `(uid=${referrer})`,
                },
            );
            if (searchResultLehrer.searchEntries.length > 0) {
                return { ok: true, value: true };
            }
            return { ok: true, value: false };
        });
    }

    private async modifyPersonAttributesInternal(
        oldReferrer: PersonReferrer,
        newGivenName?: string,
        newSn?: string,
        newReferrer?: PersonReferrer,
    ): Promise<Result<string>> {
        return this.mutex.runExclusive(async () => {
            this.logger.info('LDAP: modifyPersonAttributes');
            const client: Client = this.ldapClient.getClient();
            const bindResult: Result<boolean> = await this.bind();
            if (!bindResult.ok) return bindResult;

            const searchResult: SearchResult = await client.search(`${this.ldapInstanceConfig.BASE_DN}`, {
                scope: 'sub',
                filter: `(uid=${oldReferrer})`,
                attributes: [LdapClientService.GIVEN_NAME, LdapClientService.SUR_NAME, 'uid', 'dn'],
                returnAttributeValues: true,
            });
            if (!searchResult.searchEntries[0]) {
                this.logger.error(`Modifying person-attributes FAILED, no entry for person:${oldReferrer}`);
                return {
                    ok: false,
                    error: new LdapSearchError(LdapEntityType.LEHRER),
                };
            }

            const entryDn: string = searchResult.searchEntries[0].dn;
            const modifications: Change[] = [];

            if (newReferrer) {
                modifications.push(
                    new Change({
                        operation: 'replace',
                        modification: new Attribute({
                            type: LdapClientService.COMMON_NAME,
                            values: [newReferrer],
                        }),
                    }),
                );
            }
            if (newGivenName) {
                modifications.push(
                    new Change({
                        operation: 'replace',
                        modification: new Attribute({
                            type: LdapClientService.GIVEN_NAME,
                            values: [newGivenName],
                        }),
                    }),
                );
            }
            if (newSn) {
                modifications.push(
                    new Change({
                        operation: 'replace',
                        modification: new Attribute({
                            type: LdapClientService.SUR_NAME,
                            values: [newSn],
                        }),
                    }),
                );
            }
            if (modifications.length > 0) {
                await client.modify(entryDn, modifications);
                this.logger.info(`LDAP: Successfully modified givenName/sn attributes for person:${oldReferrer}`);
            } else {
                this.logger.info(`No givenName/sn attributes provided to modify for person:${oldReferrer}`);
            }

            if (newReferrer && searchResult.searchEntries[0]['uid'] !== newReferrer) {
                const newDn: string = `uid=${newReferrer}`;
                await client.modifyDN(entryDn, newDn);
                this.logger.info(`LDAP: Successfully updated uid for person:${oldReferrer} to ${newReferrer}`);
            }

            if (newReferrer) {
                const groupUpdateResult: Result<string> = await this.updateMemberDnInGroups(
                    oldReferrer,
                    newReferrer,
                    entryDn,
                    client,
                );
                if (!groupUpdateResult.ok) {
                    this.logger.error(`LDAP: Failed to update groups for person: ${oldReferrer}`);
                    return groupUpdateResult;
                }
            }

            return { ok: true, value: oldReferrer };
        });
    }

    private async getPersonAttributesInternal(
        personId: PersonID,
        referrer: PersonReferrer,
    ): Promise<Result<LdapPersonAttributes>> {
        return this.mutex.runExclusive(async () => {
            this.logger.info('LDAP: getPersonAttributes');
            const client: Client = this.ldapClient.getClient();
            const bindResult: Result<boolean> = await this.bind();
            if (!bindResult.ok) return bindResult;

            const searchResult: SearchResult = await client.search(`${this.ldapInstanceConfig.BASE_DN}`, {
                scope: 'sub',
                filter: `(uid=${referrer})`,
                attributes: [
                    'uid',
                    'dn',
                    LdapClientService.GIVEN_NAME,
                    LdapClientService.SUR_NAME,
                    LdapClientService.COMMON_NAME,
                    LdapClientService.MAIL_PRIMARY_ADDRESS,
                    LdapClientService.MAIL_ALTERNATIVE_ADDRESS,
                ],
                returnAttributeValues: true,
            });
            if (!searchResult.searchEntries[0]) {
                this.logger.error(
                    `Fetching person-attributes FAILED, no entry for referrer:${referrer}, personId:${personId}`,
                );
                return {
                    ok: false,
                    error: new LdapFetchAttributeError('*', referrer, personId),
                };
            }

            const givenName: Result<string> = this.getAttributeAsStringOrError(
                searchResult.searchEntries[0],
                LdapClientService.GIVEN_NAME,
                referrer,
                personId,
            );
            if (!givenName.ok) {
                return givenName;
            }
            const surName: Result<string> = this.getAttributeAsStringOrError(
                searchResult.searchEntries[0],
                LdapClientService.SUR_NAME,
                referrer,
                personId,
            );
            if (!surName.ok) {
                return surName;
            }
            const cn: Result<string> = this.getAttributeAsStringOrError(
                searchResult.searchEntries[0],
                LdapClientService.COMMON_NAME,
                referrer,
                personId,
            );
            if (!cn.ok) {
                return cn;
            }
            const mailPrimaryAddress: Result<string> = this.getAttributeAsStringOrError(
                searchResult.searchEntries[0],
                LdapClientService.MAIL_PRIMARY_ADDRESS,
                referrer,
                personId,
            );
            if (!mailPrimaryAddress.ok) {
                return mailPrimaryAddress;
            }
            const mailAlternativeAddress: Result<string> = this.getAttributeAsStringOrError(
                searchResult.searchEntries[0],
                LdapClientService.MAIL_ALTERNATIVE_ADDRESS,
                referrer,
                personId,
            );

            const personAttributes: LdapPersonAttributes = {
                givenName: givenName.value,
                cn: cn.value,
                surName: surName.value,
                mailPrimaryAddress: mailPrimaryAddress.value,
                mailAlternativeAddress: mailAlternativeAddress.ok ? mailAlternativeAddress.value : undefined,
            };

            return { ok: true, value: personAttributes };
        });
    }

    private getAttributeAsStringOrError(
        entry: Entry,
        attributeName: string,
        referrer: PersonReferrer,
        personId: PersonID,
    ): Result<string> {
        const attributeValue: unknown = entry[attributeName];
        if (typeof attributeValue === 'string') {
            return {
                ok: true,
                value: attributeValue,
            };
        }
        this.logger.error(`Could not fetch attribute:${attributeName}, personId:${personId}, referrer:${referrer}`);

        return {
            ok: false,
            error: new LdapFetchAttributeError(attributeName, referrer, personId),
        };
    }

    private async getGroupsForPersonInternal(personId: PersonID, referrer: PersonReferrer): Promise<Result<string[]>> {
        return this.mutex.runExclusive(async () => {
            this.logger.info('LDAP: getGroupsForPerson');
            const client: Client = this.ldapClient.getClient();
            const bindResult: Result<boolean> = await this.bind();
            if (!bindResult.ok) return bindResult;

            const personSearchResult: SearchResult = await client.search(`${this.ldapInstanceConfig.BASE_DN}`, {
                scope: 'sub',
                filter: `(uid=${referrer})`,
            });
            if (!personSearchResult.searchEntries[0]) {
                this.logger.error(`LDAP: No entry for uid:${referrer}, referrer:${referrer}, personId:${personId}`);
                return {
                    ok: false,
                    error: new LdapSearchError(LdapEntityType.LEHRER),
                };
            }

            const searchResult: SearchResult = await client.search(`${this.ldapInstanceConfig.BASE_DN}`, {
                scope: 'sub',
                filter: `(member=${personSearchResult.searchEntries[0].dn})`,
                attributes: ['dn', 'member'],
                returnAttributeValues: true,
            });

            const groupEntries: Entry[] | undefined = searchResult.searchEntries;

            if (!groupEntries) {
                const errMsg: string = `LDAP: Fetching groups failed, personId:${personId}, referrer:${referrer}`;
                this.logger.error(errMsg);
                return { ok: false, error: new Error(errMsg) };
            }

            if (groupEntries.length === 0) {
                this.logger.info(`LDAP: No groups found for person, personId:${personId}, referrer:${referrer}`);
                return { ok: true, value: [] };
            }

            const groupNames: string[] = groupEntries.map((entry: Entry) => entry.dn);

            return {
                ok: true,
                value: groupNames,
            };
        });
    }

    private async updateMemberDnInGroupsInternal(
        oldReferrer: PersonReferrer,
        newReferrer: PersonReferrer,
        oldUid: string,
        client: Client,
    ): Promise<Result<string>> {
        const oldLehrerUid: string = oldUid;
        const newLehrerUid: string = this.createNewLehrerUidFromOldUid(oldUid, newReferrer);

        const searchResult: SearchResult = await client.search(`${this.ldapInstanceConfig.BASE_DN}`, {
            scope: 'sub',
            filter: `(member=${oldLehrerUid})`,
            attributes: ['dn', 'member'],
            returnAttributeValues: true,
        });

        const groupEntries: Entry[] | undefined = searchResult.searchEntries;

        if (!groupEntries) {
            const errMsg: string = `LDAP: Error while searching for groups for person: ${oldReferrer}`;
            this.logger.error(errMsg);
            return { ok: false, error: new Error(errMsg) };
        }

        if (groupEntries.length === 0) {
            this.logger.info(`LDAP: No groups found for person:${oldReferrer}`);
            return { ok: true, value: `No groups found for person:${oldReferrer}` };
        }

        await Promise.allSettled(
            groupEntries.map(async (entry: Entry) => {
                const groupDn: string = entry.dn;
                const members: string | string[] | Buffer | Buffer[] | undefined = entry['member'];
                let existingMembers: string[] = [];

                if (Array.isArray(members)) {
                    existingMembers = members.map((member: string | Buffer) => {
                        if (Buffer.isBuffer(member)) {
                            return member.toString('utf-8');
                        } else {
                            return member;
                        }
                    });
                } else if (typeof members === 'string') {
                    existingMembers = [members];
                } else if (Buffer.isBuffer(members)) {
                    existingMembers = [members.toString('utf-8')];
                } else {
                    existingMembers = [];
                }

                const updatedMembers: (string | Buffer)[] = existingMembers.map((member: string | Buffer) =>
                    member === oldLehrerUid ? newLehrerUid : member,
                );

                await client
                    .modify(groupDn, [
                        new Change({
                            operation: 'replace',
                            modification: new Attribute({
                                type: 'member',
                                values: updatedMembers.map((member: string | Buffer) => member.toString()),
                            }),
                        }),
                    ])
                    .catch((err: Error) => {
                        const errMsg: string = `LDAP: Error while updating member data for group: ${groupDn}, errMsg: ${String(err)}`;
                        this.logger.error(errMsg);
                        return { ok: false, error: new Error(errMsg) };
                    });
                this.logger.info(`LDAP: Updated member data for group: ${groupDn}`);
            }),
        );
        return { ok: true, value: `Updated member data for ${groupEntries.length} groups.` };
    }

    private async deleteLehrerByReferrerInternal(referrer: PersonReferrer): Promise<Result<string>> {
        return this.mutex.runExclusive(async () => {
            this.logger.info('LDAP: deleteLehrer by referrer');
            const client: Client = this.ldapClient.getClient();
            const bindResult: Result<boolean> = await this.bind();
            if (!bindResult.ok) return bindResult;

            const searchResultLehrer: SearchResult = await client.search(`${this.ldapInstanceConfig.BASE_DN}`, {
                scope: 'sub',
                filter: `(uid=${referrer})`,
            });
            if (!searchResultLehrer.searchEntries[0]) {
                return {
                    ok: false,
                    error: new LdapSearchError(LdapEntityType.LEHRER),
                };
            }
            await client.del(searchResultLehrer.searchEntries[0].dn);
            this.logger.info(`LDAP: Successfully deleted lehrer by referrer:${referrer}`);

            return { ok: true, value: referrer };
        });
    }

    private async deleteLehrerInternal(
        person: PersonData,
        orgaKennung: OrganisationKennung,
        domain: string,
    ): Promise<Result<PersonData>> {
        const rootName: Result<string> = this.getRootNameOrError(domain);
        if (!rootName.ok) return rootName;

        return this.mutex.runExclusive(async () => {
            this.logger.info('LDAP: deleteLehrer by person');
            const client: Client = this.ldapClient.getClient();
            const bindResult: Result<boolean> = await this.bind();
            if (!bindResult.ok) return bindResult;
            if (!person.referrer) {
                return {
                    ok: false,
                    error: new UsernameRequiredError(
                        `Lehrer ${person.vorname} ${person.familienname} does not have a username`,
                    ),
                };
            }
            const lehrerUid: string = this.getLehrerUid(person.referrer, rootName.value);
            await this.removePersonFromGroup(person.referrer, orgaKennung, lehrerUid);
            try {
                const searchResultLehrer: SearchResult = await client.search(
                    `ou=${rootName.value},${this.ldapInstanceConfig.BASE_DN}`,
                    {
                        filter: `(uid=${person.referrer})`,
                    },
                );
                if (!searchResultLehrer.searchEntries[0]) {
                    this.logger.info(`LDAP: Lehrer ${lehrerUid} does not exist, nothing to delete`);

                    return { ok: true, value: person };
                }
                await client.del(lehrerUid);
                this.logger.info(`LDAP: Successfully deleted lehrer ${lehrerUid}`);

                return { ok: true, value: person };
            } catch (err) {
                const errMsg: string = JSON.stringify(err);
                this.logger.error(`LDAP: Deleting lehrer FAILED, uid:${lehrerUid}, errMsg:${errMsg}`);
                return { ok: false, error: new LdapCreateLehrerError() };
            }
        });
    }

    private async changeEmailAddressByPersonIdInternal(
        personId: PersonID,
        referrer: PersonReferrer,
        newEmailAddress: string,
    ): Promise<Result<PersonID>> {
        // Converted to avoid PersonRepository-ref, UEM-password-generation
        return this.mutex.runExclusive(async () => {
            this.logger.info('LDAP: changeEmailAddress');
            const splitted: string[] = newEmailAddress.split('@');
            if (!splitted || !splitted[1]) {
                this.logger.error(`LDAP: Invalid email-address:${newEmailAddress}`);

                return {
                    ok: false,
                    error: new LdapEmailAddressError(),
                };
            }
            const domain: string = splitted[1];
            const rootName: Result<string> = this.getRootNameOrError(domain);
            if (!rootName.ok) return rootName;
            const client: Client = this.ldapClient.getClient();
            const bindResult: Result<boolean> = await this.bind();
            if (!bindResult.ok) return bindResult;
            const searchResult: SearchResult = await client.search(
                `ou=${rootName.value},${this.ldapInstanceConfig.BASE_DN}`,
                {
                    scope: 'sub',
                    filter: `(uid=${referrer})`,
                    attributes: [LdapClientService.MAIL_PRIMARY_ADDRESS, LdapClientService.MAIL_ALTERNATIVE_ADDRESS],
                    returnAttributeValues: true,
                },
            );
            if (!searchResult.searchEntries[0]) {
                this.logger.error(
                    `Changing email-address in LDAP FAILED, no entry for personId:${personId}, referrer:${referrer}`,
                );
                return {
                    ok: false,
                    error: new LdapSearchError(LdapEntityType.LEHRER),
                };
            }
            // result can be a simple string or a string-array
            let currentEmailAddressString: string | undefined;
            const currentLDAPEmailAddressString: unknown =
                searchResult.searchEntries[0][LdapClientService.MAIL_PRIMARY_ADDRESS];
            if (typeof currentLDAPEmailAddressString === 'string') {
                currentEmailAddressString = currentLDAPEmailAddressString;
            }
            if (Array.isArray(currentLDAPEmailAddressString) && typeof currentLDAPEmailAddressString[0] === 'string') {
                currentEmailAddressString = currentLDAPEmailAddressString[0];
            }
            const currentEmailAddress: string = currentEmailAddressString ?? newEmailAddress;

            try {
                await client.modify(searchResult.searchEntries[0].dn, [
                    new Change({
                        operation: 'replace',
                        modification: new Attribute({
                            type: LdapClientService.MAIL_PRIMARY_ADDRESS,
                            values: [newEmailAddress],
                        }),
                    }),
                ]);
                await client.modify(searchResult.searchEntries[0].dn, [
                    new Change({
                        operation: 'replace',
                        modification: new Attribute({
                            type: LdapClientService.MAIL_ALTERNATIVE_ADDRESS,
                            values: [currentEmailAddress],
                        }),
                    }),
                ]);
                this.logger.info(
                    `LDAP: Successfully modified mailPrimaryAddress and mailAlternativeAddress for personId:${personId}, referrer:${referrer}`,
                );
                this.eventService.publish(
                    new LdapPersonEntryChangedEvent(personId, newEmailAddress, currentEmailAddress),
                );

                return { ok: true, value: personId };
            } catch (err) {
                const errMsg: string = JSON.stringify(err);
                this.logger.error(
                    `LDAP: Modifying mailPrimaryAddress and mailAlternativeAddress FAILED, errMsg:${errMsg}`,
                );

                return { ok: false, error: new LdapModifyEmailError() };
            }
        });
    }

    private async addPersonToGroupInternal(
        personUid: string,
        orgaKennung: OrganisationKennung,
        lehrerUid: string,
    ): Promise<Result<boolean>> {
        const groupId: string = 'lehrer-' + orgaKennung;
        this.logger.info(`LDAP: Adding person ${personUid} to group ${groupId}`);
        const client: Client = this.ldapClient.getClient();
        const bindResult: Result<boolean> = await this.bind();
        if (!bindResult.ok) return bindResult;

        const orgUnitDn: string = `ou=${orgaKennung},${this.ldapInstanceConfig.BASE_DN}`;
        const searchResultOrgUnit: SearchResult = await client.search(`${this.ldapInstanceConfig.BASE_DN}`, {
            filter: `(ou=${orgaKennung})`,
        });

        if (!searchResultOrgUnit.searchEntries[0]) {
            this.logger.info(`LDAP: organizationalUnit ${orgaKennung} not found, creating organizationalUnit`);

            const newOrgUnit: { ou: string; objectClass: string } = {
                ou: orgaKennung,
                objectClass: 'organizationalUnit',
            };
            await client.add(orgUnitDn, newOrgUnit);
        }

        const orgRoleDn: string = `cn=${LdapClientService.GROUPS},${orgUnitDn}`;
        const searchResultOrgRole: SearchResult = await client.search(orgUnitDn, {
            filter: `(cn=${LdapClientService.GROUPS})`,
        });
        if (!searchResultOrgRole.searchEntries[0]) {
            const newOrgRole: { cn: string; objectClass: string } = {
                cn: LdapClientService.GROUPS,
                objectClass: 'organizationalRole',
            };
            await client.add(orgRoleDn, newOrgRole);
        }

        const lehrerDn: string = `cn=${groupId},${orgRoleDn}`;
        const searchResultGroupOfNames: SearchResult = await client.search(orgRoleDn, {
            filter: `(cn=${groupId})`,
        });
        if (!searchResultGroupOfNames.searchEntries[0]) {
            const newLehrerGroup: { cn: string; objectclass: string[]; member: string[] } = {
                cn: groupId,
                objectclass: ['groupOfNames'],
                member: [lehrerUid],
            };
            try {
                await client.add(lehrerDn, newLehrerGroup);
                this.logger.info(`LDAP: Successfully created group ${groupId} and added person ${personUid}`);
                return { ok: true, value: true };
            } catch (err) {
                const errMsg: string = `LDAP: Failed to create group ${groupId}, errMsg: ${String(err)}`;
                this.logger.error(errMsg);
                return { ok: false, error: new LdapAddPersonToGroupError() };
            }
        }
        if (this.isPersonInSearchResult(searchResultGroupOfNames.searchEntries[0], lehrerUid)) {
            this.logger.info(`LDAP: Person ${personUid} is already in group ${groupId}`);
            return { ok: true, value: false };
        }

        try {
            await client.modify(searchResultGroupOfNames.searchEntries[0].dn, [
                new Change({
                    operation: 'add',
                    modification: new Attribute({
                        type: 'member',
                        values: [lehrerUid],
                    }),
                }),
            ]);
            this.logger.info(`LDAP: Successfully added person ${personUid} to group ${groupId}`);
            return { ok: true, value: true };
        } catch (err) {
            const errMsg: string = `LDAP: Failed to add person to group ${groupId}, errMsg: ${String(err)}`;
            this.logger.error(errMsg);
            return { ok: false, error: new LdapAddPersonToGroupError() };
        }
    }

    private async removePersonFromGroupInternal(
        referrer: PersonReferrer,
        orgaKennung: OrganisationKennung,
        lehrerUid: string,
    ): Promise<Result<boolean>> {
        const groupId: string = 'lehrer-' + orgaKennung;
        this.logger.info(`LDAP: Removing person ${referrer} from group ${groupId}`);
        const client: Client = this.ldapClient.getClient();
        const bindResult: Result<boolean> = await this.bind();
        if (!bindResult.ok) return bindResult;
        const searchResultOrgUnit: SearchResult = await client.search(
            `cn=${LdapClientService.GROUPS},ou=${orgaKennung},${this.ldapInstanceConfig.BASE_DN}`,
            {
                filter: `(cn=${groupId})`,
            },
        );

        if (!searchResultOrgUnit.searchEntries[0]) {
            const errMsg: string = `LDAP: Group ${groupId} not found`;
            this.logger.error(errMsg);
            return { ok: false, error: new Error(errMsg) };
        }

        if (!this.isPersonInSearchResult(searchResultOrgUnit.searchEntries[0], lehrerUid)) {
            this.logger.info(`LDAP: Person ${referrer} is not in group ${groupId}`);
            return { ok: false, error: new Error(`Person ${referrer} is not in group ${groupId}`) };
        }
        const groupDn: string = searchResultOrgUnit.searchEntries[0].dn;
        try {
            if (typeof searchResultOrgUnit.searchEntries[0]['member'] === 'string') {
                await client.del(groupDn);
                this.logger.info(`LDAP: Successfully removed person ${referrer} from group ${groupId}`);
                this.logger.info(`LDAP: Successfully deleted group ${groupId}`);
                return { ok: true, value: true };
            }
            await client.modify(groupDn, [
                new Change({
                    operation: 'delete',
                    modification: new Attribute({
                        type: 'member',
                        values: [lehrerUid],
                    }),
                }),
            ]);
            this.logger.info(`LDAP: Successfully removed person ${referrer} from group ${groupId}`);
            return { ok: true, value: true };
        } catch (err) {
            const errMsg: string = `LDAP: Failed to remove person from group ${groupId}, errMsg: ${String(err)}`;
            this.logger.error(errMsg);
            return { ok: false, error: new LdapRemovePersonFromGroupError() };
        }
    }

    private isPersonInSearchResult(searchEntry: Entry, lehrerUid: string): boolean | undefined {
        const member: string | string[] | Buffer | Buffer[] | undefined = searchEntry['member'];

        if (typeof member === 'string') {
            return member === lehrerUid;
        }

        if (Buffer.isBuffer(member)) {
            return member.toString() === lehrerUid;
        }

        if (Array.isArray(member)) {
            return member.some((entry: string | Buffer) => {
                if (typeof entry === 'string') {
                    return entry === lehrerUid;
                }
                return entry.toString() === lehrerUid;
            });
        }

        return false;
    }

    private async changeUserPasswordByPersonIdInternal(
        personId: PersonID,
        referrer: PersonReferrer,
    ): Promise<Result<PersonID>> {
        // Converted to avoid PersonRepository-ref, UEM-password-generation
        const userPassword: string = generatePassword();

        return this.mutex.runExclusive(async () => {
            this.logger.info('LDAP: changeUserPassword');
            const client: Client = this.ldapClient.getClient();
            const bindResult: Result<boolean> = await this.bind();
            if (!bindResult.ok) return bindResult;

            const searchResult: SearchResult = await client.search(`${LdapClientService.DC_SCHULE_SH_DC_DE}`, {
                scope: 'sub',
                filter: `(uid=${referrer})`,
                attributes: [LdapClientService.USER_PASSWORD],
                returnAttributeValues: true,
            });
            if (!searchResult.searchEntries[0]) {
                this.logger.error(
                    `Modifying user-password FAILED, no entry for personId:${personId}, referrer:${referrer}`,
                );
                return {
                    ok: false,
                    error: new LdapSearchError(LdapEntityType.LEHRER),
                };
            }

            try {
                await client.modify(searchResult.searchEntries[0].dn, [
                    new Change({
                        operation: 'replace',
                        modification: new Attribute({
                            type: LdapClientService.USER_PASSWORD,
                            values: [userPassword],
                        }),
                    }),
                ]);
                this.logger.info(
                    `LDAP: Successfully modified userPassword (UEM) for personId:${personId}, referrer:${referrer}`,
                );
                this.eventService.publish(new LdapPersonEntryChangedEvent(personId, undefined, undefined, true));

                return { ok: true, value: userPassword };
            } catch (err) {
                const errMsg: string = JSON.stringify(err);
                this.logger.error(
                    `LDAP: Modifying userPassword (UEM) FAILED for personId:${personId}, referrer:${referrer}, errMsg:${errMsg}`,
                );

                return { ok: false, error: new LdapModifyUserPasswordError() };
            }
        });
    }

    private async executeWithRetry<T>(
        func: () => Promise<Result<T>>,
        retries: number,
        delay: number = 1000,
    ): Promise<Result<T>> {
        let currentAttempt: number = 1;
        let result: Result<T, Error> = {
            ok: false,
            error: new Error('executeWithRetry default fallback'),
        };

        while (currentAttempt <= retries) {
            try {
                // eslint-disable-next-line no-await-in-loop
                result = await func();
                if (result.ok) {
                    return result;
                } else {
                    throw new Error(`Function returned error: ${result.error.message}`);
                }
            } catch (error) {
                const currentDelay: number = delay * Math.pow(currentAttempt, 3);
                this.logger.warning(
                    `Attempt ${currentAttempt} failed. Retrying in ${currentDelay}ms... Remaining retries: ${retries - currentAttempt}`,
                );

                // eslint-disable-next-line no-await-in-loop
                await this.sleep(currentDelay);
            }
            currentAttempt++;
        }
        this.logger.error(`All ${retries} attempts failed. Exiting with failure.`);
        return result;
    }

    private async sleep(ms: number): Promise<void> {
        return new Promise<void>((resolve: () => void) => setTimeout(resolve, ms));
    }
}
