import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { LoggerModule } from '../../core/logging/logger.module.js';
import { OxService } from './domain/ox.service.js';
import { OxEventHandler } from './domain/ox-event-handler.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { PersonModule } from '../person/person.module.js';
import { ServiceProviderModule } from '../service-provider/service-provider.module.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';

@Module({
    imports: [
        RolleModule,
        PersonModule,
        PersonenKontextModule,
        ServiceProviderModule,
        LoggerModule.register(OxModule.name),
        HttpModule,
    ],
    providers: [OxService, OxEventHandler],
    exports: [OxService],
})
export class OxModule {}
