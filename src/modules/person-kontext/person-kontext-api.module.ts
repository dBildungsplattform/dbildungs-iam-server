import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonenkontextUc } from '../person-kontext/api/personenkontext.uc.js';
import { PersonenkontextController } from '../person-kontext/api/personenkontext.controller.js';
import { PersonModule } from '../person/person.module.js';
import { PersonenkontextService } from './domain/personenkontext.service.js';
import { PersonenkontextRepo } from './persistence/personenkontext.repo.js';
import { PersonRepo } from '../person/persistence/person.repo.js';

@Module({
    imports: [PersonModule, LoggerModule.register(PersonKontextApiModule.name)],
    providers: [PersonenkontextUc, PersonenkontextService, PersonenkontextRepo, PersonRepo],
    controllers: [PersonenkontextController],
})
export class PersonKontextApiModule {}
