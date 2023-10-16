import { Module } from '@nestjs/common';
import { FrontendController } from './api/frontend.controller.js';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [HttpModule],
    providers: [],
    controllers: [FrontendController],
})
export class FrontendApiModule {}
