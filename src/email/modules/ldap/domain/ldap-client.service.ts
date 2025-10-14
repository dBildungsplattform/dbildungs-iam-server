import { Injectable } from '@nestjs/common';
import { Client, SearchResult } from 'ldapts';
import { LdapPersonEntry } from './ldap.types.js';
import { LdapClient } from './ldap-client.js';
import { LdapInstanceConfig } from '../ldap-instance-config.js';
import { Mutex } from 'async-mutex';
import { LdapEmailDomainError } from '../error/ldap-email-domain.error.js';
import { LdapCreateLehrerError } from '../error/ldap-create-lehrer.error.js';
import { ClassLogger } from '../../../../core/logging/class-logger.js';
import { PersonReferrer } from '../../../../shared/types/index.js';

export type LdapPersonAttributes = {
    entryUUID?: string;
    dn: string;
    givenName?: string;
    surName?: string;
    cn?: string;
    mailPrimaryAddress?: string;
    mailAlternativeAddress?: string;
};

export type PersonData = {
    firstName: string;
    lastName: string;
    username: string;
};

@Injectable()
export class LdapClientService {
    public static readonly FALLBACK_RETRIES: number = 3; // e.g. FALLBACK_RETRIES = 3 will produce retry sequence: 1sek, 8sek, 27sek (1000ms * retrycounter^3)

    public static readonly OEFFENTLICHE_SCHULEN_DOMAIN_DEFAULT: string = 'schule-sh.de';

    public static readonly ERSATZ_SCHULEN_DOMAIN_DEFAULT: string = 'ersatzschule-sh.de';

    public static readonly OEFFENTLICHE_SCHULEN_OU: string = 'oeffentlicheSchulen';

    public static readonly ERSATZ_SCHULEN_OU: string = 'ersatzSchulen';

    public static readonly DN: string = 'dn';

    public static readonly UID: string = 'uid';

    public static readonly GIVEN_NAME: string = 'givenName';

    public static readonly SUR_NAME: string = 'sn';

    public static readonly COMMON_NAME: string = 'cn';

    public static readonly MAIL_PRIMARY_ADDRESS: string = 'mailPrimaryAddress';

    public static readonly MAIL_ALTERNATIVE_ADDRESS: string = 'mailAlternativeAddress';

    public static readonly USER_PASSWORD: string = 'userPassword';

    public static readonly MEMBER: string = 'member';

    public static readonly ENTRY_UUID: string = 'entryUUID';

    public static readonly DC_SCHULE_SH_DC_DE: string = 'dc=schule-sh,dc=de';

    public static readonly GID_NUMBER: string = '100'; //because 0 to 99 are used for statically allocated user groups on Unix-systems

    public static readonly UID_NUMBER: string = '100'; //to match the GID_NUMBER rule above and 0 is reserved for super-user

    public static readonly HOME_DIRECTORY: string = 'none'; //highlight it's a dummy value

    public static readonly ATTRIBUTE_VALUE_EMPTY: string = 'empty';

    private mutex: Mutex;

    public constructor(
        private readonly ldapClient: LdapClient,
        private readonly ldapInstanceConfig: LdapInstanceConfig,
        private readonly logger: ClassLogger,
    ) {
        this.mutex = new Mutex();
    }

    //** BELOW ONLY PUBLIC FUNCTIONS - MUST USE THE 'executeWithRetry' WRAPPER TO HAVE STRONG FAULT TOLERANCE*/

    public async createPerson(person: PersonData, domain: string, mail: string): Promise<Result<PersonData>> {
        return this.executeWithRetry(() => this.createPersonInternal(person, domain, mail), this.getNrOfRetries());
    }

    public async getEntryUUIDByUsername(username: PersonReferrer): Promise<Result<string>> {
        this.logger.info('LDAP: getEntryUUID');
        const client: Client = this.ldapClient.getClient();
        const bindResult: Result<boolean> = await this.bind();
        if (!bindResult.ok) {
            return bindResult;
        }
        const searchResult: SearchResult = await client.search(`${this.ldapInstanceConfig.BASE_DN}`, {
            scope: 'sub',
            filter: `(uid=${username})`,
            attributes: [LdapClientService.ENTRY_UUID],
            returnAttributeValues: true,
        });

        const entryUUID: unknown = searchResult.searchEntries[0]?.[LdapClientService.ENTRY_UUID];

        if (typeof entryUUID !== 'string') {
            this.logger.error(`Could not get EntryUUID for username:${username}`);
            return {
                ok: false,
                error: new LdapCreateLehrerError(),
            };
        }

        return {
            ok: true,
            value: entryUUID,
        };
    }

    //** BELOW ONLY PRIVATE HELPER FUNCTIONS THAT NOT OPERATE ON LDAP - MUST NOT USE THE 'executeWithRetry'/

    private getNrOfRetries(): number {
        return this.ldapInstanceConfig.RETRY_WRAPPER_DEFAULT_RETRIES != null
            ? this.ldapInstanceConfig.RETRY_WRAPPER_DEFAULT_RETRIES
            : LdapClientService.FALLBACK_RETRIES;
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
            this.logger.logUnknownAsError(`Could not connect to LDAP`, err);

            return { ok: false, error: new Error('LDAP bind FAILED') };
        }
    }

    private getRootName(emailDomain: string): Result<string, LdapEmailDomainError> {
        if (
            emailDomain === this.ldapInstanceConfig.ERSATZSCHULEN_DOMAIN ||
            emailDomain === LdapClientService.ERSATZ_SCHULEN_DOMAIN_DEFAULT
        ) {
            return {
                ok: true,
                value: LdapClientService.ERSATZ_SCHULEN_OU,
            };
        }
        if (
            emailDomain === this.ldapInstanceConfig.OEFFENTLICHE_SCHULEN_DOMAIN ||
            emailDomain === LdapClientService.OEFFENTLICHE_SCHULEN_DOMAIN_DEFAULT
        ) {
            return {
                ok: true,
                value: LdapClientService.OEFFENTLICHE_SCHULEN_OU,
            };
        }

        return {
            ok: false,
            error: new LdapEmailDomainError(),
        };
    }

    private getLehrerUid(username: PersonReferrer, rootName: string): string {
        return `uid=${username},ou=${rootName},${this.ldapInstanceConfig.BASE_DN}`;
    }

    private getRootNameOrError(domain: string): Result<string> {
        const rootName: Result<string> = this.getRootName(domain);
        if (!rootName.ok) {
            this.logger.error(`Could not get root-name because email-domain is invalid, domain:${domain}`);
        }
        return rootName;
    }

    private async createPersonInternal(person: PersonData, domain: string, mail: string): Promise<Result<PersonData>> {
        const username: PersonReferrer | undefined = person.username;
        if (!username) {
            return {
                ok: false,
                error: new LdapCreateLehrerError(),
            };
        }
        const rootName: Result<string> = this.getRootNameOrError(domain);
        if (!rootName.ok) {
            return rootName;
        }

        const lehrerUid: string = this.getLehrerUid(username, rootName.value);
        return this.mutex.runExclusive(async () => {
            this.logger.info('LDAP: createLehrer');
            const client: Client = this.ldapClient.getClient();
            const bindResult: Result<boolean> = await this.bind();
            if (!bindResult.ok) {
                return bindResult;
            }

            const searchResultLehrer: SearchResult = await client.search(
                `ou=${rootName.value},${this.ldapInstanceConfig.BASE_DN}`,
                {
                    filter: `(uid=${person.username})`,
                },
            );
            if (searchResultLehrer.searchEntries.length > 0) {
                this.logger.info(`LDAP: Lehrer ${lehrerUid} exists, nothing to create`);

                return { ok: true, value: person };
            }
            const entry: LdapPersonEntry = {
                uid: username,
                uidNumber: LdapClientService.UID_NUMBER,
                gidNumber: LdapClientService.GID_NUMBER,
                homeDirectory: LdapClientService.HOME_DIRECTORY,
                cn: username,
                givenName: person.firstName,
                sn: person.lastName,
                objectclass: ['inetOrgPerson', 'univentionMail', 'posixAccount'],
                mailPrimaryAddress: mail,
                mailAlternativeAddress: mail,
            };

            try {
                await client.add(lehrerUid, entry);
                return { ok: true, value: person };
            } catch (err) {
                this.logger.logUnknownAsError(`LDAP: Creating lehrer FAILED, uid:${lehrerUid}`, err);

                return { ok: false, error: new LdapCreateLehrerError() };
            }
        });
    }

    private async executeWithRetry<T>(
        func: () => Promise<Result<T>>,
        retries: number,
        delay: number = 15000,
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
                this.logger.logUnknownAsError(
                    `Attempt ${currentAttempt} failed. Retrying in ${delay}ms... Remaining retries: ${retries - currentAttempt}`,
                    error,
                );

                if (currentAttempt < retries) {
                    // eslint-disable-next-line no-await-in-loop
                    await this.sleep(delay);
                }
            }
            currentAttempt++;
        }
        this.logger.error(`All ${retries} attempts failed. Exiting with failure.`);
        return result;
    }

    private async sleep(ms: number): Promise<void> {
        // eslint-disable-next-line no-promise-executor-return
        return new Promise<void>((resolve: () => void) => setTimeout(resolve, ms));
    }
}
