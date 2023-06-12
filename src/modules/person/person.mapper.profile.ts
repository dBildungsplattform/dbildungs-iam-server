import { Mapper, MappingProfile, createMap, forMember, mapFrom } from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { CreatePersonBodyParams, CreatePersonDTO, CreatePersonResponse } from './dto/index.js';
import { PersonDO } from './person.do.js';
import { PersonEntity } from './person.entity.js';

@Injectable()
export class PersonMapperProfile extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(
                mapper,
                CreatePersonBodyParams,
                CreatePersonDTO,
                forMember(
                    (dest) => dest.lastName,
                    mapFrom((src) => src.name.lastName),
                ),
                forMember(
                    (dest) => dest.firstName,
                    mapFrom((src) => src.name.firstName),
                ),
                forMember(
                    (dest) => dest.initialsLastName,
                    mapFrom((src) => src.name.initialsLastName),
                ),
                forMember(
                    (dest) => dest.initialsFirstName,
                    mapFrom((src) => src.name.initialsFirstName),
                ),
                forMember(
                    (dest) => dest.nickName,
                    mapFrom((src) => src.name.nickName),
                ),
            );
            createMap(mapper, CreatePersonDTO, PersonEntity);
            createMap(mapper, PersonEntity, PersonDO);
            createMap(mapper, PersonDO, CreatePersonResponse);
        };
    }
}
