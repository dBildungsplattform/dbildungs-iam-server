import { Injectable, Provider } from '@nestjs/common';
<<<<<<<< HEAD:src/email/modules/ldap/ldap-email-microservice-instance-config.ts
import { EmailAppConfig } from '../../../shared/config/email-app.config.js';
import { LdapEmailMicroserviceConfig } from '../../../shared/config/ldap-email-microservice.config.js';
========
import { EmailAppConfig } from '../../../../../shared/config/email-app.config.js';
import { LdapConfig } from '../../../../../shared/config/ldap.config.js';
>>>>>>>> main:src/email/modules/ldap/adapter/technical/ldap-instance-config.ts

@Injectable()
export class LdapEmailMicroserviceInstanceConfig implements LdapEmailMicroserviceConfig {
    public constructor(
        public ENABLED: boolean,
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
            provide: LdapEmailMicroserviceInstanceConfig,
            useFactory: (config: EmailAppConfig): LdapEmailMicroserviceInstanceConfig => {
                const ldapConfig: LdapEmailMicroserviceConfig = config.LDAP;

                return new LdapEmailMicroserviceInstanceConfig(
                    ldapConfig.ENABLED,
                    ldapConfig.URL,
                    ldapConfig.BIND_DN,
                    ldapConfig.ADMIN_PASSWORD,
                    ldapConfig.BASE_DN,
                    ldapConfig.OEFFENTLICHE_SCHULEN_DOMAIN,
                    ldapConfig.ERSATZSCHULEN_DOMAIN,
                    ldapConfig.RETRY_WRAPPER_DEFAULT_RETRIES,
                );
            },
            inject: [EmailAppConfig],
        };
    }
}
