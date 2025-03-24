import { Global, Module } from '@nestjs/common';
import { EntityAggregateMapper } from './entity-aggregate.mapper.js';
import { LoggerModule } from '../../../core/logging/logger.module.js';import { RolleModule } from '../../rolle/rolle.module.js';
import { OrganisationModule } from '../../organisation/organisation.module.js';
import { PersonenKontextModule } from '../../personenkontext/personenkontext.module.js';

@Global()
@Module({
    imports: [LoggerModule.register(MapperModule.name), RolleModule, OrganisationModule, PersonenKontextModule],
    providers: [EntityAggregateMapper],
    exports: [EntityAggregateMapper],
})
export class MapperModule {}
