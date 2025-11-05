import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module';
import { EmailResolverService } from './domain/email-resolver.service';
import { RolleModule } from '../rolle/rolle.module';
import { EmailMicroserviceEventHandler } from './domain/email-microservice-event-handler';

@Module({
    imports: [HttpModule, RolleModule, LoggerModule.register(EmailMicroserviceModule.name)],
    providers: [EmailResolverService, EmailMicroserviceEventHandler],
    exports: [EmailResolverService],
})
export class EmailMicroserviceModule {}
