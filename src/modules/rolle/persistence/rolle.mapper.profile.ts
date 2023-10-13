import { Inject, Injectable } from '@nestjs/common';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, Mapper, MappingProfile } from '@automapper/core';
import { RolleDo } from '../domain/rolle.do.js';
import { RolleEntity } from './rolle.entity.js';

@Injectable()
export class RolleMapperProfile extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(mapper, RolleDo, RolleEntity);
            createMap(
                mapper,
                RolleEntity,
                RolleDo,
                forMember(
                    (dest: RolleDo<true>) => dest.id,
                    mapFrom((src: RolleEntity) => src.id),
                ),
            );
        };
    }
}
