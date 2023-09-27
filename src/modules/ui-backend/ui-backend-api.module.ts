import { Module } from '@nestjs/common';
import { LoginController } from './api/login.controller.js';
import { LoginService } from './domain/login.service.js';

@Module({
    imports: [],
    providers: [LoginService],
    controllers: [LoginController],
})
export class UiBackendApiModule {}
