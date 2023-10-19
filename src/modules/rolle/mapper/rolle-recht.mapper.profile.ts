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
            createMap(mapper, RolleRechtDo, RolleRechtEntity,
                //new
                forMember(
                    (dest: RolleRechtEntity) => dest.id,
                    mapFrom((src: RolleRechtDo<boolean>) => src.id),
                ),);
            createMap(
                mapper,
                RolleRechtEntity,
                RolleRechtDo,
                forMember(
                    (dest: RolleRechtDo<boolean>) => dest.id,
                    mapFrom((src: RolleRechtEntity) => src.id),
                ),
            );
        };
    }
}
