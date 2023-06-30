import { Mapper, MappingProfile, createMap, forMember, mapFrom } from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { CreatePersonBodyParams } from './api/create-person.body.params.js';
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
                    (dest: CreatePersonDto) => dest.lastName,
                    mapFrom((src: CreatePersonBodyParams) => src.name.lastName),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.firstName,
                    mapFrom((src: CreatePersonBodyParams) => src.name.firstName),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.initialsLastName,
                    mapFrom((src: CreatePersonBodyParams) => src.name.initialsLastName),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.initialsFirstName,
                    mapFrom((src: CreatePersonBodyParams) => src.name.initialsFirstName),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.nickName,
                    mapFrom((src: CreatePersonBodyParams) => src.name.nickName),
                ),
            );
            createMap(mapper, CreatePersonDto, PersonDo);
            createMap(
                mapper,
                PersonDo,
                PersonEntity,
                forMember(
                    (dest: PersonEntity) => dest.id,
                    mapFrom((src: PersonDo<boolean>) => src.id),
                ),
                forMember(
                    (dest: PersonEntity) => dest.createdAt,
                    mapFrom((src: PersonDo<boolean>) => src.createdAt),
                ),
                forMember(
                    (dest: PersonEntity) => dest.updatedAt,
                    mapFrom((src: PersonDo<boolean>) => src.updatedAt),
                ),
            );
            createMap(
                mapper,
                PersonEntity,
                PersonDo,
                forMember(
                    (dest: PersonDo<boolean>) => dest.id,
                    mapFrom((src: PersonEntity) => src.id),
                ),
                forMember(
                    (dest: PersonDo<boolean>) => dest.createdAt,
                    mapFrom((src: PersonEntity) => src.createdAt),
                ),
                forMember(
                    (dest: PersonDo<boolean>) => dest.updatedAt,
                    mapFrom((src: PersonEntity) => src.updatedAt),
                ),
            );
        };
    }
}
