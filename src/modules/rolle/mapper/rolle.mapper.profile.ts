import { Mapper, MappingProfile, createMap, forMember, ignore } from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';

import { CreateRolleBodyParams } from '../api/create-rolle.body.params.js';
import { RolleResponse } from '../api/rolle.response.js';
import { Rolle } from '../domain/rolle.js';
import { RolleEntity } from '../entity/rolle.entity.js';

@Injectable()
export class RolleMapperProfile extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            // API Mappers
            createMap(mapper, Rolle, RolleResponse);
            createMap(
                mapper,
                CreateRolleBodyParams,
                Rolle,
                forMember((dest: Rolle) => dest.id, ignore()),
                forMember((dest: Rolle) => dest.createdAt, ignore()),
                forMember((dest: Rolle) => dest.updatedAt, ignore()),
            );

            // Mapping between Rolle and RolleEntity
            createMap(mapper, RolleEntity, Rolle);
            createMap(mapper, Rolle, RolleEntity);
        };
    }
}
