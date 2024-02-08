import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonenkontextUc } from '../person-kontext/api/personenkontext.uc.js';
import { PersonenkontextController } from '../person-kontext/api/personenkontext.controller.js';

@Module({
    imports: [LoggerModule.register(PersonKontextApiModule.name)],
    providers: [PersonenkontextUc],
    controllers: [PersonenkontextController],
})
export class PersonKontextApiModule {}
