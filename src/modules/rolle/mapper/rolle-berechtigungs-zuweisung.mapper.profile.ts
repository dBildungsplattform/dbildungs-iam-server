import { Inject, Injectable } from '@nestjs/common';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, Mapper, MappingProfile } from '@automapper/core';
import { RolleBerechtigungsZuweisungDo } from '../domain/rolle-berechtigungs-zuweisung.do.js';
import { RolleBerechtigungsZuweisungEntity } from '../entity/rolle-berechtigungs-zuweisung.entity.js';

@Injectable()
export class RolleBerechtigungsZuweisungMapperProfile extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(
                mapper,
                RolleBerechtigungsZuweisungDo,
                RolleBerechtigungsZuweisungEntity,
                /*    forMember(
                    (dest: RolleBerechtigungsZuweisungEntity) => dest.rolleRecht,
                    ignore()));*/
                forMember(
                    (dest: RolleBerechtigungsZuweisungEntity) => dest.rolleRecht,
                    mapFrom((src: RolleBerechtigungsZuweisungDo<boolean>) => src.rolleRecht),
                ),
            );
            createMap(
                mapper,
                RolleBerechtigungsZuweisungEntity,
                RolleBerechtigungsZuweisungDo,
                forMember(
                    (dest: RolleBerechtigungsZuweisungDo<boolean>) => dest.id,
                    mapFrom((src: RolleBerechtigungsZuweisungEntity) => src.id),
                ),
                forMember(
                    (dest: RolleBerechtigungsZuweisungDo<boolean>) => dest.rolleRecht,
                    mapFrom((src: RolleBerechtigungsZuweisungEntity) => src.rolleRecht),
                ),
            );
        };
    }
}
