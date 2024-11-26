import { Module } from '@nestjs/common';
import { ConfigController } from './api/config.controller.js';

@Module({
    controllers: [ConfigController],
})
export class ConfigModule {}
