import { Mapper, MappingProfile, createMap } from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { CreatePersonBodyParams, CreatePersonDO, CreatePersonResponse, PersonDO } from './dto/index.js';
import { PersonEntity } from './person.entity.js';

@Injectable()
export class PersonProfile extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(mapper, CreatePersonBodyParams, CreatePersonDO);
            createMap(mapper, CreatePersonDO, PersonEntity);
            createMap(mapper, PersonEntity, PersonDO);
            createMap(mapper, PersonDO, CreatePersonResponse);
        };
    }
}
