import { Injectable, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from '../../shared/config/index.js';
import { LdapConfig } from '../../shared/config/ldap.config.js';

@Injectable()
export class LdapInstanceConfig implements LdapConfig {
    public constructor(
        public URL: string,
        public BIND_DN: string,
        public PASSWORD: string,
    ) {}

    public static fromConfigService(): Provider {
        return {
            provide: LdapInstanceConfig,
            useFactory: (configService: ConfigService<ServerConfig>): LdapInstanceConfig => {
                const ldapConfig: LdapConfig = configService.getOrThrow<LdapConfig>('LDAP');

                return new LdapInstanceConfig(ldapConfig.URL, ldapConfig.BIND_DN, ldapConfig.PASSWORD);
            },
            inject: [ConfigService],
        };
    }
}
