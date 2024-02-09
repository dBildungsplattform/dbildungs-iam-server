import { Inject, Injectable } from '@nestjs/common';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { createMap, forMember, mapFrom, Mapper, MappingProfile } from '@automapper/core';
import { PersonRollenZuweisungDo } from '../../service-provider/domain/person-rollen-zuweisung.do.js';
import { PersonRollenZuweisungEntity } from '../../service-provider/entity/person-rollen-zuweisung.entity.js';

@Injectable()
export class PersonRollenZuweisungMapperProfile extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(mapper, PersonRollenZuweisungDo, PersonRollenZuweisungEntity);
            createMap(
                mapper,
                PersonRollenZuweisungEntity,
                PersonRollenZuweisungDo,
                forMember(
                    (dest: PersonRollenZuweisungDo<true>) => dest.id,
                    mapFrom((src: PersonRollenZuweisungEntity) => src.id),
                ),
            );
        };
    }
}
