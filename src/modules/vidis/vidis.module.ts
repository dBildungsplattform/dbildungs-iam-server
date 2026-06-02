import { forwardRef, Module } from '@nestjs/common';
import { VidisApiService } from './domain/vidis.api-service.js';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from '../../core/logging/logger.module.js';
import { VidisSyncService } from './domain/vidis.sync-service.js';
import { OrganisationModule } from '../organisation/organisation.module.js';
import { RolleModule } from '../rolle/rolle.module.js';
import { ServiceProviderModule } from '../service-provider/service-provider.module.js';

@Module({
    imports: [
        LoggerModule.register(VidisModule.name),
        HttpModule,
        OrganisationModule,
        forwardRef(() => RolleModule),
        forwardRef(() => ServiceProviderModule),
    ],
    providers: [VidisApiService, VidisSyncService],
    exports: [],
    controllers: [],
})
export class VidisModule {}
