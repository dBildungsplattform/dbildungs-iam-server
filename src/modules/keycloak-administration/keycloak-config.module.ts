import { Global, Module } from '@nestjs/common';
import { KeycloakInstanceConfig } from './keycloak-instance-config.js';

@Global()
@Module({
    providers: [KeycloakInstanceConfig.fromConfigService()],
    exports: [KeycloakInstanceConfig],
})
export class KeycloakConfigModule {}
