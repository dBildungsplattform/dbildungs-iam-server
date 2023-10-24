import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { AuthenticatedGuard } from './api/authentication.guard.js';
import { FrontendController } from './api/frontend.controller.js';
import { BackendHttpService } from './outbound/backend-http.service.js';
import { LoginService } from './outbound/login.service.js';

@Module({
    imports: [HttpModule],
    providers: [LoginService, AuthenticatedGuard, BackendHttpService],
    controllers: [FrontendController],
})
export class FrontendApiModule {}
