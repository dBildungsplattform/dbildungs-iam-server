import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { FrontendController } from './api/frontend.controller.js';
import { AuthenticatedGuard, OIDCClientProvider, OpenIdConnectStrategy, SessionSerializer } from './auth/index.js';
import { BackendHttpService } from './outbound/backend-http.service.js';

@Module({
    imports: [HttpModule, PassportModule.register({ session: true, defaultStrategy: 'oidc' })],
    providers: [AuthenticatedGuard, BackendHttpService, OpenIdConnectStrategy, SessionSerializer, OIDCClientProvider],
    controllers: [FrontendController],
})
export class FrontendApiModule {}
