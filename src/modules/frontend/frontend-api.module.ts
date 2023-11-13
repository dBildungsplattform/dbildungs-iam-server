import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { FrontendController } from './api/frontend.controller.js';
import { AuthenticatedGuard, OIDCClientProvider, OpenIdConnectStrategy, SessionSerializer } from './auth/index.js';
import { BackendHttpService } from './outbound/backend-http.service.js';
import { ProviderService } from './outbound/provider.service.js';
import { PersonService } from './outbound/person.service.js';
@Module({
    imports: [HttpModule, PassportModule.register({ session: true, defaultStrategy: 'oidc', keepSessionInfo: true })],
    providers: [
        AuthenticatedGuard,
        BackendHttpService,
        ProviderService,
        PersonService,
        OpenIdConnectStrategy,
        SessionSerializer,
        OIDCClientProvider,
    ],
    controllers: [FrontendController],
})
export class FrontendApiModule {}
