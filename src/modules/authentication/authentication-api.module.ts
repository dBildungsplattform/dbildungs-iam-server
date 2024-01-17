import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { AuthenticationController } from './api/frontend.controller.js';
import { OpenIdConnectStrategy } from './passport/oidc.strategy.js';
import { SessionSerializer } from './passport/session.serializer.js';
import { OIDCClientProvider } from './services/oidc-client.service.js';

@Module({
    imports: [
        HttpModule,
        LoggerModule.register(AuthenticationApiModule.name),
        PassportModule.register({ session: true, defaultStrategy: 'oidc', keepSessionInfo: true }),
    ],
    providers: [OpenIdConnectStrategy, SessionSerializer, OIDCClientProvider],
    controllers: [AuthenticationController],
})
export class AuthenticationApiModule {}
