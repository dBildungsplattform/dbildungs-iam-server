import { classes } from '@automapper/classes';
import { CamelCaseNamingConvention } from '@automapper/core';
import { AutomapperModule } from '@automapper/nestjs';
import { Module } from '@nestjs/common';
import { mappingErrorHandler } from '../../src/shared/error/index.js';

@Module({
    imports: [
        AutomapperModule.forRoot({
            strategyInitializer: classes(),
            namingConventions: new CamelCaseNamingConvention(),
            errorHandler: mappingErrorHandler,
        }),
    ],
})
export class MapperTestModule {}
