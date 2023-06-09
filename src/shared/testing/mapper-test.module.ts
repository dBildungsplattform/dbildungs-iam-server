import { classes } from '@automapper/classes';
import { CamelCaseNamingConvention } from '@automapper/core';
import { AutomapperModule } from '@automapper/nestjs';
import { Module } from '@nestjs/common';
import { MappingError } from '../index.js';

@Module({
    imports: [
        AutomapperModule.forRoot({
            strategyInitializer: classes(),
            namingConventions: new CamelCaseNamingConvention(),
            errorHandler: {
                handle: (error: unknown): void => {
                    throw new MappingError(error);
                },
            },
        }),
    ],
})
export class MapperTestModule {}
