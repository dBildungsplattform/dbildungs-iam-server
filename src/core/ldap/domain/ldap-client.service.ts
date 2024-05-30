import { Injectable } from '@nestjs/common';
import { ClassLogger } from '../../logging/class-logger.js';
import { Client } from 'ldapts';
import { LdapOrganisationEntry, LdapPersonEntry, LdapRoleEntry } from './ldap.types.js';
import { KennungRequiredForSchuleError } from '../../../modules/organisation/specification/error/kennung-required-for-schule.error.js';
import { Person } from '../../../modules/person/domain/person.js';
import { Organisation } from '../../../modules/organisation/domain/organisation.js';
import { LdapClient } from './ldap-client.js';
import { LdapInstanceConfig } from '../ldap-instance-config.js';

@Injectable()
export class LdapClientService {
    public constructor(
        private readonly ldapClient: LdapClient,
        private readonly ldapInstanceConfig: LdapInstanceConfig,
        private readonly logger: ClassLogger,
    ) {}

    private async bind(): Promise<Result<boolean>> {
        this.logger.info('Inside bind');
        try {
            await this.ldapClient.getClient().bind(this.ldapInstanceConfig.BIND_DN, this.ldapInstanceConfig.PASSWORD);
            this.logger.info('Successfully connected to LDAP');
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
        this.logger.info('Inside createOrganisation');
        const client: Client = this.ldapClient.getClient();
        const bindResult: Result<boolean> = await this.bind();
        if (!bindResult.ok) return bindResult;
        if (!organisation.kennung) return { ok: false, error: new KennungRequiredForSchuleError() };
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
        this.logger.info(`Successfully created organisation ou=${organisation.kennung}`);

        await client.add(`cn=lehrer,ou=${organisation.kennung},ou=oeffentlicheSchulen,dc=schule-sh,dc=de`, roleEntry);
        this.logger.info(`Successfully created corresponding lehrer rolle for ou=${organisation.kennung}`);

        return { ok: true, value: organisation };
    }

    public async deleteOrganisation(organisation: Organisation<true>): Promise<Result<Organisation<true>>> {
        this.logger.info('Inside deleteOrganisation');
        const client: Client = this.ldapClient.getClient();
        const bindResult: Result<boolean> = await this.bind();
        if (!bindResult.ok) return bindResult;
        if (!organisation.kennung) return { ok: false, error: new KennungRequiredForSchuleError() };

        this.logger.info('Successfully connected to LDAP');

        await client.del(`cn=lehrer,ou=${organisation.kennung},ou=oeffentlicheSchulen,dc=schule-sh,dc=de`);
        this.logger.info(`Successfully deleted corresponding lehrer rolle for ou=${organisation.kennung}`);

        await client.del(`ou=${organisation.kennung},ou=oeffentlicheSchulen,dc=schule-sh,dc=de`);
        this.logger.info(`Successfully deleted organisation ou=${organisation.kennung}`);

        return { ok: true, value: organisation };
    }

    public async createLehrer(person: Person<true>, organisation: Organisation<true>): Promise<Result<Person<true>>> {
        this.logger.info('Inside createLehrer');
        const client: Client = this.ldapClient.getClient();
        const bindResult: Result<boolean> = await this.bind();
        if (!bindResult.ok) return bindResult;
        if (!organisation.kennung) return { ok: false, error: new KennungRequiredForSchuleError() };
        const entry: LdapPersonEntry = {
            cn: person.vorname,
            sn: person.familienname,
            mail: ['testme@mail.de'],
            objectclass: ['inetOrgPerson'],
        };

        await client.add(
            `uid=${person.vorname}${person.familienname},cn=lehrer,ou=${organisation.kennung},ou=oeffentlicheSchulen,dc=schule-sh,dc=de`,
            entry,
        );
        this.logger.info(
            `Successfully created lehrer uid=${person.vorname}${person.familienname},cn=lehrer,ou=${organisation.kennung},ou=oeffentlicheSchulen,dc=schule-sh,dc=de`,
        );

        return { ok: true, value: person };
    }

    public async deleteLehrer(person: Person<true>, organisation: Organisation<true>): Promise<Result<Person<true>>> {
        this.logger.info('Inside deleteLehrer');
        const client: Client = this.ldapClient.getClient();
        const bindResult: Result<boolean> = await this.bind();
        if (!bindResult.ok) return bindResult;
        if (!organisation.kennung) return { ok: false, error: new KennungRequiredForSchuleError() };

        await client.del(
            `uid=${person.vorname}${person.familienname},cn=lehrer,ou=${organisation.kennung},ou=oeffentlicheSchulen,dc=schule-sh,dc=de`,
        );
        this.logger.info(
            `Successfully deleted lehrer uid=${person.vorname}${person.familienname},cn=lehrer,ou=${organisation.kennung},ou=oeffentlicheSchulen,dc=schule-sh,dc=de`,
        );

        return { ok: true, value: person };
    }
}
