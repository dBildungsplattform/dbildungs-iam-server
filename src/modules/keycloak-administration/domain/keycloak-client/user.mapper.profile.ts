import { Mapper, MappingProfile, createMap, forMember, mapFrom } from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';

import { UserDo } from '../user.do.js';
import { UserRepresentationDto } from './user-representation.dto.js';

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
                    (dest: UserDo<boolean>) => dest.createdDate,
                    mapFrom((src: UserRepresentationDto) => new Date(src.createdTimestamp)),
                ),
            );
        };
    }
}
