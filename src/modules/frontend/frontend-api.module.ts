import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AuthenticatedGuard } from './api/authentication.guard.js';
import { AuthenticationInterceptor } from './api/authentication.interceptor.js';
import { FrontendController } from './api/frontend.controller.js';
import { LoginService } from './outbound/login.service.js';

@Module({
    imports: [HttpModule],
    providers: [LoginService, AuthenticationInterceptor, AuthenticatedGuard],
    controllers: [FrontendController],
})
export class FrontendApiModule {}
