import { Inject, Injectable } from '@nestjs/common';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, Mapper, MappingProfile } from '@automapper/core';
import { RolleRechtDo } from '../domain/rolle-recht.do.js';
import { RolleRechtEntity } from '../../../persistence/rolle-recht.entity.js';

@Injectable()
export class RolleRechtMapperProfile extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(mapper, RolleRechtDo, RolleRechtEntity);
            createMap(
                mapper,
                RolleRechtEntity,
                RolleRechtDo,
                forMember(
                    (dest: RolleRechtDo<true>) => dest.id,
                    mapFrom((src: RolleRechtEntity) => src.id),
                ),
            );
        };
    }
}
