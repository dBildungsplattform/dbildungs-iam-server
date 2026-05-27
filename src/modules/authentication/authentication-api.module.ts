import { HttpModule } from '@nestjs/axios';
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { AuthenticationController } from './api/authentication.controller.js';
import { OpenIdConnectStrategy } from './passport/oidc.strategy.js';
import { InternalCommunicationApiKeyStrategy } from './passport/internalcommunicationapikey.strategy.js';
import { SessionSerializer } from './passport/session.serializer.js';
import { OIDCClientProvider } from './services/oidc-client.service.js';
import { PersonPermissionsRepo } from './domain/person-permission.repo.js';
import { PersonModule } from '../person/person.module.js';
import { SessionAccessTokenMiddleware } from './services/session-access-token.middleware.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { JwtStrategy } from './passport/jwt.strategy.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { KeycloakAdministrationModule } from '../keycloak-administration/keycloak-administration.module.js';
import { UserExternaldataWorkflowFactory } from './domain/user-extenaldata.factory.js';
import { KeycloakInternalController } from './api/keycloakinternal.controller.js';
import { EmailMicroserviceModule } from '../email-microservice/email-microservice.module.js';
import { ExternalDataCacheInterceptor } from '../../shared/cache/external-data-cache-interceptor.js';
import { CsrfTokenService } from './services/csrf-token-service.js';
import { CsrfProtectionGuard } from './api/csrf-token-guard.js';
import { CsrfRefreshMiddleware } from './middleware/csrf-refresh.middleware.js';
import { EmailPersistenceModule } from '../email/email-persistence.module.js';

@Module({
    imports: [
        HttpModule,
        LoggerModule.register(AuthenticationApiModule.name),
        PersonModule,
        PersonenKontextModule,
        OrganisationModule,
        RolleModule,
        KeycloakAdministrationModule,
        EmailMicroserviceModule,
        EmailPersistenceModule,
    ],
    providers: [
        OpenIdConnectStrategy,
        JwtStrategy,
        InternalCommunicationApiKeyStrategy,
        SessionSerializer,
        OIDCClientProvider,
        PersonPermissionsRepo,
        SessionAccessTokenMiddleware,
        UserExternaldataWorkflowFactory,
        ExternalDataCacheInterceptor,
        CsrfTokenService,
        {
            provide: APP_GUARD,
            useClass: CsrfProtectionGuard,
        },
    ],
    controllers: [AuthenticationController, KeycloakInternalController],
    exports: [OIDCClientProvider, PersonPermissionsRepo],
})
export class AuthenticationApiModule implements NestModule {
    public configure(consumer: MiddlewareConsumer): void {
        consumer.apply(CsrfRefreshMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
    }
}
