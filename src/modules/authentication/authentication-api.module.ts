import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { AuthenticationController } from './api/authentication.controller.js';
import { OpenIdConnectStrategy } from './passport/oidc.strategy.js';
import { SessionSerializer } from './passport/session.serializer.js';
import { OIDCClientProvider } from './services/oidc-client.service.js';
import { PersonPermissionsRepo } from './domain/person-permission.repo.js';
import { PersonModule } from '../person/person.module.js';
import { SessionAccessTokenMiddleware } from './services/session-access-token.middleware.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';

@Module({
    imports: [
        HttpModule,
        LoggerModule.register(AuthenticationApiModule.name),
        PassportModule.register({ session: true, defaultStrategy: 'oidc', keepSessionInfo: true }),
        PersonModule,
        PersonenKontextModule,
    ],
    providers: [OpenIdConnectStrategy, SessionSerializer, OIDCClientProvider, PersonPermissionsRepo, SessionAccessTokenMiddleware],
    controllers: [AuthenticationController],
    exports: [OIDCClientProvider],
})
export class AuthenticationApiModule {}
