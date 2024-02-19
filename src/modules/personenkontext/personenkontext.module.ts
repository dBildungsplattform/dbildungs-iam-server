import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { PersonenkontextRepo } from '../personenkontext/persistence/personenkontext.repo.js';
import { PersonenkontextService } from '../personenkontext/domain/personenkontext.service.js';
import { PersonModule } from '../person/person.module.js';
import { PersonRepo } from '../person/persistence/person.repo.js';

@Module({
    imports: [PersonModule, LoggerModule.register(PersonenKontextModule.name)],
    providers: [PersonenkontextRepo, PersonenkontextService, PersonRepo],
    exports: [PersonenkontextService, PersonenkontextRepo],
})
export class PersonenKontextModule {}
