import { Inject, Injectable } from '@nestjs/common';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { convertUsing, createMap, forMember, mapFrom, Mapper, MappingProfile, mapWith } from '@automapper/core';
import { RolleBerechtigungsZuweisungDo } from '../domain/rolle-berechtigungs-zuweisung.do.js';
import { RolleBerechtigungsZuweisungEntity } from '../entity/rolle-berechtigungs-zuweisung.entity.js';
import { ServiceProviderZugriffDoRolleRechtEntityConverter } from './service-provider-zugriff-do-rolle-recht-entity.converter.js';
import { RolleEntity } from '../entity/rolle.entity.js';
import { Rolle } from '../domain/rolle.js';

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
                        new ServiceProviderZugriffDoRolleRechtEntityConverter(),
                        (source: RolleBerechtigungsZuweisungDo<boolean>) => source.rolleRecht,
                    ),
                ),
                forMember(
                    (dest: RolleBerechtigungsZuweisungEntity) => dest.rolle,
                    mapWith(RolleEntity, Rolle, (source: RolleBerechtigungsZuweisungDo<boolean>) => source.rolle),
                ),
            );
            createMap(
                mapper,
                RolleBerechtigungsZuweisungEntity,
                RolleBerechtigungsZuweisungDo,
                forMember(
                    (dest: RolleBerechtigungsZuweisungDo<true>) => dest.rolleRecht,
                    mapFrom((source: RolleBerechtigungsZuweisungEntity) => source.rolleRecht),
                ),
            );
        };
    }
}
