import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { FrontendController } from './api/frontend.controller.js';
import { AuthenticatedGuard, OIDCClientProvider, OpenIdConnectStrategy, SessionSerializer } from './auth/index.js';
import { BackendHttpService } from './outbound/backend-http.service.js';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { ProviderService } from './outbound/provider.service.js';
import { PersonService } from './outbound/person.service.js';
import { OrganisationService } from './outbound/organisation.service.js';

@Module({
    imports: [
        HttpModule,
        LoggerModule.register(FrontendApiModule.name),
        PassportModule.register({ session: true, defaultStrategy: 'oidc', keepSessionInfo: true }),
    ],
    providers: [
        AuthenticatedGuard,
        BackendHttpService,
        ProviderService,
        PersonService,
        OrganisationService,
        OpenIdConnectStrategy,
        SessionSerializer,
        OIDCClientProvider,
    ],
    controllers: [FrontendController],
})
export class FrontendApiModule {}
