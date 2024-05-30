import { Injectable } from '@nestjs/common';
import { Client } from 'ldapts';
import { LdapInstanceConfig } from '../ldap-instance-config.js';

@Injectable()
export class LdapClient {
    private client: Client | undefined;

    public constructor(private readonly ldapInstanceConfig: LdapInstanceConfig) {}

    public getClient(): Client {
        if (!this.client) {
            // configure LDAP connection
            const client: Client = new Client({
                url: this.ldapInstanceConfig.URL,
            });
            this.client = client;
        }
        return this.client;
    }
}
