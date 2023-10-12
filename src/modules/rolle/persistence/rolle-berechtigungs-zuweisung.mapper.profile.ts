import { Inject, Injectable } from '@nestjs/common';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, Mapper, MappingProfile } from '@automapper/core';
import { RolleBerechtigungsZuweisungDo } from '../domain/rolle-berechtigungs-zuweisung.do.js';
import { RolleBerechtigungsZuweisungEntity } from '../../../persistence/rolle-berechtigungs-zuweisung.entity.js';

@Injectable()
export class RolleBerechtigungsZuweisungMapperProfile extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(mapper, RolleBerechtigungsZuweisungDo, RolleBerechtigungsZuweisungEntity);
            createMap(
                mapper,
                RolleBerechtigungsZuweisungEntity,
                RolleBerechtigungsZuweisungDo,
                forMember(
                    (dest: RolleBerechtigungsZuweisungDo<true>) => dest.id,
                    mapFrom((src: RolleBerechtigungsZuweisungEntity) => src.id),
                ),
            );
        };
    }
}
