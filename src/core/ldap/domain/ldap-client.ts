import { Injectable } from '@nestjs/common';
import { Client } from 'ldapts';
import { ClassLogger } from '../../logging/class-logger.js';
import { LdapInstanceConfig } from '../ldap-instance-config.js';

@Injectable()
export class LdapClient {
    private client: Client | undefined;

    public constructor(
        private readonly logger: ClassLogger,
        private readonly ldapInstanceConfig: LdapInstanceConfig,
    ) {}

    public async getClient(): Promise<Result<Client>> {
        if (!this.client) {
            // configure LDAP connection
            const client: Client = new Client({
                url: this.ldapInstanceConfig.URL,
            });
            try {
                await client.bind(this.ldapInstanceConfig.BIND_DN, this.ldapInstanceConfig.PASSWORD);
                this.logger.info('Successfully connected to LDAP');
                this.client = client;
            } catch (err) {
                const errMsg: string = `Could not connect to LDAP, message: ${JSON.stringify(err)}`;
                this.logger.error(errMsg);
                return { ok: false, error: new Error(errMsg) };
            }
        }

        return { ok: true, value: this.client };
    }
}
