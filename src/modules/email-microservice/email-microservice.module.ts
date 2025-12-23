import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { EmailResolverService } from './domain/email-resolver.service.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { EmailMicroserviceEventHandler } from './domain/email-microservice-event-handler.js';
import { PersonenKontextModule } from '../personenkontext/personenkontext.module.js';
import { PersonModule } from '../person/person.module.js';

@Module({
    imports: [
        HttpModule,
        RolleModule,
        forwardRef(() => PersonenKontextModule),
        forwardRef(() => PersonModule),
        LoggerModule.register(EmailMicroserviceModule.name),
    ],
    providers: [EmailResolverService, EmailMicroserviceEventHandler],
    exports: [EmailResolverService],
})
export class EmailMicroserviceModule {}
