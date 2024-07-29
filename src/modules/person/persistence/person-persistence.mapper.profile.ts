import { Mapper, MappingProfile, createMap } from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { PersonDo } from '../domain/person.do.js';
import { PersonEntity } from '../persistence/person.entity.js';

@Injectable()
export class PersonPersistenceMapperProfile extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(mapper, PersonDo, PersonEntity);
            createMap(mapper, PersonEntity, PersonDo);
        };
    }
}
