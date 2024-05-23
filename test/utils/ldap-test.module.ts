import { DynamicModule, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenericContainer, PullPolicy, StartedTestContainer } from 'testcontainers';
import { ServerConfig } from '../../src/shared/config/index.js';
import { LdapInstanceConfig } from '../../src/core/ldap/ldap-instance-config.js';
import { LdapConfig } from '../../src/shared/config/ldap.config.js';

type LdapConfigTestModuleOptions = { isLdapRequired: boolean };

export class LdapTestModule implements OnModuleDestroy {
    private static ldap: Option<StartedTestContainer>;

    public static forRoot(options?: LdapConfigTestModuleOptions): DynamicModule {
        return {
            module: LdapTestModule,
            providers: [
                {
                    provide: LdapInstanceConfig,
                    useFactory: async (configService: ConfigService<ServerConfig>): Promise<LdapInstanceConfig> => {
                        const ldapConfig: LdapConfig = configService.getOrThrow<LdapConfig>('LDAP');

                        if (options?.isLdapRequired) {
                            this.ldap = await new GenericContainer('docker.io/osixia/openldap:1.5.0')
                                .withCopyDirectoriesToContainer([
                                    {
                                        source: './config/ldif',
                                        target: '/container/service/slapd/assets/config/bootstrap/ldif/custom/ldif',
                                    },
                                ])
                                .withPullPolicy(PullPolicy.defaultPolicy())
                                .withExposedPorts(389)
                                .withEnvironment({
                                    LDAP_ADMIN_PASSWORD: 'admin',
                                    LDAP_CONFIG_PASSWORD: 'config',
                                    LDAP_BASE_DN: 'dc=schule-sh,dc=de',
                                    LDAP_DOMAIN: 'schule-sh.de',
                                    LDAP_ORGANISATION: 'schule-sh-de',
                                })
                                .withCommand(['--copy-service']) // '--loglevel', 'debug'
                                .withStartupTimeout(240000)
                                .start();
                        }

                        const baseUrl: string = this.ldap
                            ? `ldap://${this.ldap.getHost()}:${this.ldap.getFirstMappedPort()}`
                            : ldapConfig.URL;

                        return new LdapInstanceConfig(baseUrl, ldapConfig.BIND_DN, ldapConfig.PASSWORD);
                    },
                    inject: [ConfigService],
                },
            ],
            exports: [LdapInstanceConfig],
        };
    }

    public async onModuleDestroy(): Promise<void> {
        await LdapTestModule.ldap?.stop();
    }
}
