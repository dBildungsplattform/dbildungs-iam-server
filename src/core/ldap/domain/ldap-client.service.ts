import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../logging/class-logger.js';
import { Client, SearchResult } from 'ldapts';
import { LdapEntityType, LdapOrganisationEntry, LdapPersonEntry, LdapRoleEntry } from './ldap.types.js';
import { KennungRequiredForSchuleError } from '../../../modules/organisation/specification/error/kennung-required-for-schule.error.js';
import { Person } from '../../../modules/person/domain/person.js';
import { Organisation } from '../../../modules/organisation/domain/organisation.js';
import { LdapClient } from './ldap-client.js';
import { LdapInstanceConfig } from '../ldap-instance-config.js';
import { UsernameRequiredError } from '../../../modules/person/domain/username-required.error.js';
import { Mutex } from 'async-mutex';
import { SchuleNotFoundErrror } from '../error/schule-not-found.errror.js';
import { LdapSearchError } from '../error/ldap-search.error.js';

@Injectable()
export class LdapClientService {
    private mutex: Mutex;

    public constructor(
        private readonly ldapClient: LdapClient,
        private readonly ldapInstanceConfig: LdapInstanceConfig,
        private readonly logger: ClassLogger,
    ) {
        this.mutex = new Mutex();
    }

    private async bind(): Promise<Result<boolean>> {
        this.logger.info('LDAP: bind');
        try {
            await this.ldapClient.getClient().bind(this.ldapInstanceConfig.BIND_DN, this.ldapInstanceConfig.PASSWORD);
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

    public async createOrganisation(organisation: Organisation<true>): Promise<Result<Organisation<true>>> {
        return this.mutex.runExclusive(async () => {
            this.logger.info('LDAP: createOrganisation');
            if (!organisation.kennung) return { ok: false, error: new KennungRequiredForSchuleError() };
            const client: Client = this.ldapClient.getClient();
            const bindResult: Result<boolean> = await this.bind();
            if (!bindResult.ok) return bindResult;
            const organisationEntry: LdapOrganisationEntry = {
                ou: organisation.kennung,
                objectclass: ['organizationalUnit'],
            };
            const roleEntry: LdapRoleEntry = {
                cn: 'lehrer',
                ou: organisation.kennung,
                objectclass: ['organizationalRole'],
            };
            await client.add(`ou=${organisation.kennung},ou=oeffentlicheSchulen,dc=schule-sh,dc=de`, organisationEntry);
            this.logger.info(`LDAP: Successfully created organisation ou=${organisation.kennung}`);

            await client.add(
                `cn=lehrer,ou=${organisation.kennung},ou=oeffentlicheSchulen,dc=schule-sh,dc=de`,
                roleEntry,
            );
            this.logger.info(`LDAP: Successfully created corresponding lehrer rolle for ou=${organisation.kennung}`);

            return { ok: true, value: organisation };
        });
    }

    private async existsSchule(kennung: string): Promise<Result<boolean>> {
        return this.mutex.runExclusive(async () => {
            const client: Client = this.ldapClient.getClient();
            const bindResult: Result<boolean> = await this.bind();
            if (!bindResult.ok) return bindResult;
            const searchResult: SearchResult = await client.search(`ou=oeffentlicheSchulen,dc=schule-sh,dc=de`, {
                filter: `(ou=${kennung})`,
            });

            return {
                ok: true,
                value: searchResult.searchEntries.length > 0,
            };
        });
    }

    public async deleteOrganisation(organisation: Organisation<true>): Promise<Result<Organisation<true>>> {
        return this.mutex.runExclusive(async () => {
            this.logger.info('LDAP: deleteOrganisation');
            const client: Client = this.ldapClient.getClient();
            const bindResult: Result<boolean> = await this.bind();
            if (!bindResult.ok) return bindResult;
            if (!organisation.kennung) return { ok: false, error: new KennungRequiredForSchuleError() };

            this.logger.info('LDAP: Successfully connected to LDAP');

            await client.del(`cn=lehrer,ou=${organisation.kennung},ou=oeffentlicheSchulen,dc=schule-sh,dc=de`);
            this.logger.info(`LDAP: Successfully deleted corresponding lehrer rolle for ou=${organisation.kennung}`);

            await client.del(`ou=${organisation.kennung},ou=oeffentlicheSchulen,dc=schule-sh,dc=de`);
            this.logger.info(`LDAP: Successfully deleted organisation ou=${organisation.kennung}`);

            return { ok: true, value: organisation };
        });
    }

    public async createLehrer(person: Person<true>, organisation: Organisation<true>): Promise<Result<Person<true>>> {
        if (!organisation.kennung) return { ok: false, error: new KennungRequiredForSchuleError() };
        if (!person.referrer) {
            return {
                ok: false,
                error: new UsernameRequiredError(
                    `Lehrer ${person.vorname} ${person.familienname} does not have a username`,
                ),
            };
        }
        const lehrerUid: string = this.getLehrerUid(person, organisation);
        const existsSchule: Result<boolean> = await this.existsSchule(organisation.kennung);
        if (!existsSchule.ok || !existsSchule.value) {
            return {
                ok: false,
                error: new SchuleNotFoundErrror(organisation.kennung),
            };
        }
        const existsLehrer: Result<boolean> = await this.existsLehrer(person.referrer, organisation.kennung);
        if (!existsLehrer.ok) {
            return {
                ok: false,
                error: new LdapSearchError(LdapEntityType.LEHRER),
            };
        } else if (existsLehrer.value) {
            return {
                ok: true,
                value: person,
            };
        }
        return this.mutex.runExclusive(async () => {
            this.logger.info('LDAP: createLehrer');
            const client: Client = this.ldapClient.getClient();
            const bindResult: Result<boolean> = await this.bind();
            if (!bindResult.ok) return bindResult;
            const entry: LdapPersonEntry = {
                cn: person.vorname,
                sn: person.familienname,
                mail: [`${person.referrer}@schule-sh.de`],
                objectclass: ['inetOrgPerson'],
            };
            await client.add(lehrerUid, entry);
            this.logger.info(`LDAP: Successfully created lehrer ${lehrerUid}`);

            return { ok: true, value: person };
        });
    }

    private async existsLehrer(referrer: string, kennung: string): Promise<Result<boolean>> {
        return this.mutex.runExclusive(async () => {
            const client: Client = this.ldapClient.getClient();
            const bindResult: Result<boolean> = await this.bind();
            if (!bindResult.ok) return bindResult;
            try {
                const searchResult: SearchResult = await client.search(
                    `cn=lehrer,ou=${kennung},ou=oeffentlicheSchulen,dc=schule-sh,dc=de`,
                    {
                        filter: `(uid=${referrer})`,
                    },
                );
                return {
                    ok: true,
                    value: searchResult.searchEntries.length > 0,
                };
            } catch (err) {
                return {
                    ok: false,
                    error: new LdapSearchError(LdapEntityType.LEHRER),
                };
            }
        });
    }

    private getLehrerUid(person: Person<true>, organisation: Organisation<true>): string {
        return `uid=${person.referrer},cn=lehrer,ou=${organisation.kennung},ou=oeffentlicheSchulen,dc=schule-sh,dc=de`;
    }

    public async deleteLehrer(person: Person<true>, organisation: Organisation<true>): Promise<Result<Person<true>>> {
        return this.mutex.runExclusive(async () => {
            this.logger.info('LDAP: deleteLehrer');
            const client: Client = this.ldapClient.getClient();
            const bindResult: Result<boolean> = await this.bind();
            if (!bindResult.ok) return bindResult;
            if (!organisation.kennung) return { ok: false, error: new KennungRequiredForSchuleError() };
            if (!person.referrer)
                return {
                    ok: false,
                    error: new UsernameRequiredError(
                        `Lehrer ${person.vorname} ${person.familienname} does not have a username`,
                    ),
                };
            const lehrerUid: string = this.getLehrerUid(person, organisation);
            await client.del(lehrerUid);
            this.logger.info(`LDAP: Successfully deleted lehrer ${lehrerUid}`);

            return { ok: true, value: person };
        });
    }
}
