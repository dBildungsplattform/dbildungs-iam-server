import { Module } from '@nestjs/common';
import { FrontendController } from './api/frontend.controller.js';

@Module({
    imports: [],
    providers: [],
    controllers: [FrontendController],
})
export class FrontendApiModule {}
