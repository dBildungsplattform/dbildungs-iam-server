import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonenkontextRepo } from '../person-kontext/persistence/personenkontext.repo.js';
import { PersonenkontextService } from '../person-kontext/domain/personenkontext.service.js';

@Module({
    imports: [LoggerModule.register(PersonKontextModule.name)],
    providers: [PersonenkontextRepo, PersonenkontextService],
    exports: [PersonenkontextService],
})
export class PersonKontextModule {}
