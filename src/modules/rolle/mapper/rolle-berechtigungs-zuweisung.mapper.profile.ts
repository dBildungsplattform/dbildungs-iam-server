import { Inject, Injectable } from '@nestjs/common';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { convertUsing, createMap, forMember, Mapper, MappingProfile } from '@automapper/core';
import { RolleBerechtigungsZuweisungDo } from '../domain/rolle-berechtigungs-zuweisung.do.js';
import { RolleBerechtigungsZuweisungEntity } from '../entity/rolle-berechtigungs-zuweisung.entity.js';
import { SpzdoRollerechtentityConverter } from './spzdo-rollerechtentity.converter.js';

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
                forMember(
                    (dest: RolleBerechtigungsZuweisungEntity) => dest.rolleRecht,
                    convertUsing(
                        new SpzdoRollerechtentityConverter(),
                        (source: RolleBerechtigungsZuweisungDo<boolean>) => source.rolleRecht,
                    ),
                ),
            );
            createMap(mapper, RolleBerechtigungsZuweisungEntity, RolleBerechtigungsZuweisungDo);
        };
    }
}
