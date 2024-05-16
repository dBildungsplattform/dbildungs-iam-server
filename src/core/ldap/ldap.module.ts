import { Module } from '@nestjs/common';
import { LoggerModule } from '../logging/logger.module.js';
import { LdapEventHandler } from './domain/ldap-event-handler.js';
import { LdapClientService } from './domain/ldap-client.service.js';

@Module({
    imports: [LoggerModule.register(LdapModule.name)],
    providers: [LdapEventHandler, LdapClientService],
    exports: [LdapEventHandler, LdapClientService],
})
export class LdapModule {}
