import { Inject, Injectable } from '@nestjs/common';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { Mapper, MappingProfile, convertUsing, createMap, forMember, mapFrom } from '@automapper/core';
import { RolleBerechtigungsZuweisungDo } from '../domain/rolle-berechtigungs-zuweisung.do.js';
import { RolleBerechtigungsZuweisungEntity } from '../entity/rolle-berechtigungs-zuweisung.entity.js';
import { ServiceProviderZugriffDoRolleRechtEntityConverter } from './service-provider-zugriff-do-rolle-recht-entity.converter.js';

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
