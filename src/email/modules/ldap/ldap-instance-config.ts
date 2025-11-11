import { Injectable, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailAppConfig } from '../../../shared/config/email-app.config.js';
import { LdapConfig } from '../../../shared/config/ldap.config.js';

@Injectable()
export class LdapInstanceConfig implements LdapConfig {
    public constructor(
        public URL: string,
        public BIND_DN: string,
        public ADMIN_PASSWORD: string,
        public BASE_DN: string,
        public OEFFENTLICHE_SCHULEN_DOMAIN?: string,
        public ERSATZSCHULEN_DOMAIN?: string,
        public RETRY_WRAPPER_DEFAULT_RETRIES?: number,
    ) {}

    public static fromConfigService(): Provider {
        return {
            provide: LdapInstanceConfig,
            useFactory: (configService: ConfigService<EmailAppConfig>): LdapInstanceConfig => {
                const ldapConfig: LdapConfig = configService.getOrThrow<LdapConfig>('LDAP');

                return new LdapInstanceConfig(
                    ldapConfig.URL,
                    ldapConfig.BIND_DN,
                    ldapConfig.ADMIN_PASSWORD,
                    ldapConfig.BASE_DN,
                    ldapConfig.OEFFENTLICHE_SCHULEN_DOMAIN,
                    ldapConfig.ERSATZSCHULEN_DOMAIN,
                    ldapConfig.RETRY_WRAPPER_DEFAULT_RETRIES,
                );
            },
            inject: [ConfigService],
        };
    }
}
