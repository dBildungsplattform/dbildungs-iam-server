import { forwardRef, Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { ServiceProviderModule } from '../service-provider/service-provider.module.js';
import { RolleFactory } from './domain/rolle.factory.js';
import { RolleRepo } from './repo/rolle.repo.js';

@Module({
    imports: [forwardRef(() => ServiceProviderModule), LoggerModule.register(RolleModule.name), OrganisationModule],
    providers: [RolleRepo, RolleFactory],
    exports: [RolleRepo, RolleFactory],
})
export class RolleModule {}
