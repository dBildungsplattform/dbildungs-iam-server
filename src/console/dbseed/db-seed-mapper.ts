import { Inject, Injectable } from '@nestjs/common';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { createMap, Mapper, MappingProfile } from '@automapper/core';
import { PersonRollenZuweisungEntityFile } from './person-rollen-zuweisung-entity-file.js';
import { PersonRollenZuweisungEntity } from '../../modules/rolle/entity/person-rollen-zuweisung.entity.js';

@Injectable()
export class DbSeedMapper extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(mapper, PersonRollenZuweisungEntityFile, PersonRollenZuweisungEntity);
        };
    }
}
