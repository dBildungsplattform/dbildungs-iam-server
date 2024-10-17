import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../logging/class-logger.js';
import { Attribute, Change, Client, Control, SearchResult } from 'ldapts';
import { LdapEntityType, LdapPersonEntry } from './ldap.types.js';
import { LdapClient } from './ldap-client.js';
import { LdapInstanceConfig } from '../ldap-instance-config.js';
import { UsernameRequiredError } from '../../../modules/person/domain/username-required.error.js';
import { Mutex } from 'async-mutex';
import { LdapSearchError } from '../error/ldap-search.error.js';
import { PersonID } from '../../../shared/types/aggregate-ids.types.js';
import { EventService } from '../../eventbus/services/event.service.js';
import { LdapPersonEntryChangedEvent } from '../../../shared/events/ldap-person-entry-changed.event.js';
import { LdapEmailAddressError } from '../error/ldap-email-address.error.js';
import {LdapEmailDomainError} from "../error/ldap-email-domain.error.js";

export type PersonData = {
    vorname: string;
    familienname: string;
    id: string;
    referrer?: string;
    ldapEntryUUID?: string;
};

@Injectable()
export class LdapClientService {
    private mutex: Mutex;

    public constructor(
        private readonly ldapClient: LdapClient,
        private readonly ldapInstanceConfig: LdapInstanceConfig,
        private readonly logger: ClassLogger,
        private readonly eventService: EventService,
    ) {
        this.mutex = new Mutex();
    }

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

    private getRootName(emailDomain?: string): Result<string, LdapEmailDomainError> {
        if (emailDomain === 'ersatzschule-sh.de') return {
            ok: true,
            value: 'ersatzSchulen',
        };
        if (emailDomain === 'schule-sh.de') return {
            ok: true,
            value: 'oeffentlicheSchulen',
        };

        return {
            ok: false,
            error: new LdapEmailDomainError(),
        };
    }

    private getLehrerUid(referrer: string, rootName: string): string {
        return `uid=${referrer},ou=${rootName},dc=schule-sh,dc=de`;
    }

    public async createLehrer(
        person: PersonData,
        mail?: string, //Wird hier erstmal seperat mit reingegeben bis die Umstellung auf primary/alternative erfolgt
        domain?: string,
    ): Promise<Result<PersonData>> {
        if (!person.referrer) {
            return {
                ok: false,
                error: new UsernameRequiredError(
                    `Lehrer ${person.vorname} ${person.familienname} does not have a username`,
                ),
            };
        }
        const rootName: Result<string> = this.getRootName(domain);
        if (!rootName.ok) {
            this.logger.error(`Could not get root-name because email-domain is invalid, domain:${domain}`);
            return rootName;
        }
        const lehrerUid: string = this.getLehrerUid(person.referrer, rootName.value);
        return this.mutex.runExclusive(async () => {
            this.logger.info('LDAP: createLehrer');
            const client: Client = this.ldapClient.getClient();
            const bindResult: Result<boolean> = await this.bind();
            if (!bindResult.ok) return bindResult;

            const searchResultLehrer: SearchResult = await client.search(`ou=${rootName},dc=schule-sh,dc=de`, {
                filter: `(uid=${person.referrer})`,
            });
            if (searchResultLehrer.searchEntries.length > 0) {
                this.logger.info(`LDAP: Lehrer ${lehrerUid} exists, nothing to create`);

                return { ok: true, value: person };
            }
            const entry: LdapPersonEntry = {
                cn: person.vorname,
                sn: person.familienname,
                objectclass: ['inetOrgPerson', 'univentionMail'],
                mailPrimaryAddress: mail ?? ``,
                mailAlternativeAddress: mail ?? ``,
            };

            const controls: Control[] = [];
            const relaxRulesControlOID: string = '1.3.6.1.4.1.4203.666.5.12';
            entry.entryUUID = person.ldapEntryUUID ?? person.id;
            controls.push(new Control(relaxRulesControlOID));

            await client.add(lehrerUid, entry, controls);
            this.logger.info(`LDAP: Successfully created lehrer ${lehrerUid}`);

            return { ok: true, value: person };
        });
    }

    public async isLehrerExisting(referrer: string, domain?: string): Promise<Result<boolean>> {
        return this.mutex.runExclusive(async () => {
            this.logger.info('LDAP: isLehrerExisting');
            const client: Client = this.ldapClient.getClient();
            const bindResult: Result<boolean> = await this.bind();
            if (!bindResult.ok) return bindResult;

            const rootName: Result<string> = this.getRootName(domain);
            if (!rootName.ok) {
                this.logger.error(`Could not get root-name because email-domain is invalid, domain:${domain}`);
                return rootName;
            }
            const searchResultLehrer: SearchResult = await client.search(`ou=${rootName},dc=schule-sh,dc=de`, {
                filter: `(uid=${referrer})`,
            });
            if (searchResultLehrer.searchEntries.length > 0) {
                return { ok: true, value: true };
            }
            return { ok: true, value: false };
        });
    }

    public async deleteLehrerByPersonId(personId: PersonID, domain?: string): Promise<Result<PersonID>> {
        return this.mutex.runExclusive(async () => {
            this.logger.info('LDAP: deleteLehrer');
            const client: Client = this.ldapClient.getClient();
            const bindResult: Result<boolean> = await this.bind();
            if (!bindResult.ok) return bindResult;

            const rootName: Result<string> = this.getRootName(domain);
            if (!rootName.ok) {
                this.logger.error(`Could not get root-name because email-domain is invalid, domain:${domain}`);
                return rootName;
            }            const searchResultLehrer: SearchResult = await client.search(`ou=${rootName},dc=schule-sh,dc=de`, {
                scope: 'sub',
                filter: `(entryUUID=${personId})`,
            });
            if (!searchResultLehrer.searchEntries[0]) {
                return {
                    ok: false,
                    error: new LdapSearchError(LdapEntityType.LEHRER),
                };
            }
            await client.del(searchResultLehrer.searchEntries[0].dn);
            this.logger.info(`LDAP: Successfully deleted lehrer by personId:${personId}`);

            return { ok: true, value: personId };
        });
    }

    public async deleteLehrer(person: PersonData, domain?: string): Promise<Result<PersonData>> {
        return this.mutex.runExclusive(async () => {
            this.logger.info('LDAP: deleteLehrer');
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
            const rootName: Result<string> = this.getRootName(domain);
            if (!rootName.ok) {
                this.logger.error(`Could not get root-name because email-domain is invalid, domain:${domain}`);
                return rootName;
            }
            const lehrerUid: string = this.getLehrerUid(person.referrer, rootName.value);
            await client.del(lehrerUid);
            this.logger.info(`LDAP: Successfully deleted lehrer ${lehrerUid}`);

            return { ok: true, value: person };
        });
    }

    public async changeEmailAddressByPersonId(personId: PersonID, newEmailAddress: string): Promise<Result<PersonID>> {
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
            const client: Client = this.ldapClient.getClient();
            const bindResult: Result<boolean> = await this.bind();
            if (!bindResult.ok) return bindResult;
            const rootName: Result<string> = this.getRootName(domain);
            if (!rootName.ok) {
                this.logger.error(`Could not get root-name because email-domain is invalid, domain:${domain}`);
                return rootName;
            }
            const searchResult: SearchResult = await client.search(`ou=${rootName},dc=schule-sh,dc=de`, {
                scope: 'sub',
                filter: `(entryUUID=${personId})`,
                attributes: ['mailPrimaryAddress', 'mailAlternativeAddress'],
                returnAttributeValues: true,
            });
            if (!searchResult.searchEntries[0]) {
                this.logger.error(`Changing email-address in LDAP FAILED, no entry for personId:${personId}`);
                return {
                    ok: false,
                    error: new LdapSearchError(LdapEntityType.LEHRER),
                };
            }

            let currentEmailAddressString: string | undefined = searchResult.searchEntries[0][
                'mailPrimaryAddress'
            ] as string;
            // yes, that check looks crazy, although currentEmailAddressString is defined as string|undefined, sometimes it's an array with one element
            if (Array.isArray(currentEmailAddressString)) {
                currentEmailAddressString = (currentEmailAddressString as string[])[0];
            }
            const currentEmailAddress: string = currentEmailAddressString ?? newEmailAddress;

            await client.modify(searchResult.searchEntries[0].dn, [
                new Change({
                    operation: 'replace',
                    modification: new Attribute({ type: 'mailPrimaryAddress', values: [newEmailAddress] }),
                }),
            ]);
            await client.modify(searchResult.searchEntries[0].dn, [
                new Change({
                    operation: 'replace',
                    modification: new Attribute({ type: 'mailAlternativeAddress', values: [currentEmailAddress] }),
                }),
            ]);
            this.logger.info(
                `LDAP: Successfully modified mailPrimaryAddress and mailAlternativeAddress for personId:${personId}`,
            );

            this.eventService.publish(new LdapPersonEntryChangedEvent(personId, newEmailAddress, currentEmailAddress));

            return { ok: true, value: personId };
        });
    }
}
