import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { FrontendController } from './api/frontend.controller.js';
import { AuthenticatedGuard, OIDCClientProvider, OpenIdConnectStrategy, SessionSerializer } from './auth/index.js';
import { BackendHttpService } from './outbound/backend-http.service.js';
import { LoggerModule } from '../../core/logging/logger.module.js';

@Module({
    imports: [
        HttpModule,
        LoggerModule.register(FrontendApiModule.name),
        PassportModule.register({ session: true, defaultStrategy: 'oidc', keepSessionInfo: true }),
    ],
    providers: [AuthenticatedGuard, BackendHttpService, OpenIdConnectStrategy, SessionSerializer, OIDCClientProvider],
    controllers: [FrontendController],
})
export class FrontendApiModule {}
