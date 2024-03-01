import { Inject, Injectable } from '@nestjs/common';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { createMap, Mapper, MappingProfile } from '@automapper/core';
import { DataProviderFile } from './file/data-provider-file.js';
import { DataProviderEntity } from '../../persistence/data-provider.entity.js';
import { PersonFile } from './file/person-file.js';
import { PersonEntity } from '../../modules/person/persistence/person.entity.js';

@Injectable()
export class DbSeedMapper extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(mapper, DataProviderFile, DataProviderEntity);
            createMap(mapper, PersonFile, PersonEntity);
        };
    }
}
