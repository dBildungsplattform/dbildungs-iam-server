import { Mapper, MappingProfile, createMap, forMember, mapFrom } from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';

import { UserDo } from '../user.do.js';
import { UserRepresentationDto } from './user-representation.dto.js';
import { CreateUserRepresentationDto } from './create-user-representation.dto.js';

@Injectable()
export class UserMapperProfile extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(
                mapper,
                UserRepresentationDto,
                UserDo,
                forMember(
                    (dest: UserDo<boolean>) => dest.id,
                    mapFrom((src: UserRepresentationDto) => src.id),
                ),
                forMember(
                    (dest: UserDo<boolean>) => dest.username,
                    mapFrom((src: UserRepresentationDto) => src.username),
                ),
                forMember(
                    (dest: UserDo<boolean>) => dest.email,
                    mapFrom((src: UserRepresentationDto) => src.email),
                ),
                forMember(
                    (dest: UserDo<boolean>) => dest.createdDate,
                    mapFrom((src: UserRepresentationDto) => new Date(src.createdTimestamp)),
                ),
                forMember(
                    (dest: UserDo<boolean>) => dest.enabled as boolean,
                    mapFrom((src: UserRepresentationDto) => src.enabled as boolean),
                ),
                forMember(
                    (dest: UserDo<boolean>) => dest.attributes as Record<string, string>,
                    mapFrom((src: UserRepresentationDto) => src.attributes as Record<string, string>),
                ),
            );

            createMap(mapper, UserDo, CreateUserRepresentationDto);
        };
    }
}
