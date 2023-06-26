import { Mapper, MappingProfile, createMap, forMember, mapFrom } from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { CreatePersonBodyParams } from './api/create-person.body.params.js';
import { CreatePersonResponse } from './api/create-person.response.js';
import { CreatePersonDto } from './domain/create-person.dto.js';
import { PersonDo } from './domain/person.do.js';
import { PersonEntity } from './persistence/person.entity.js';

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
                CreatePersonDto,
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
            createMap(mapper, CreatePersonDto, PersonDo);
            createMap(mapper, PersonDo, PersonEntity);
            createMap(mapper, PersonEntity, PersonDo);
            createMap(mapper, PersonDo, CreatePersonResponse);
        };
    }
}
