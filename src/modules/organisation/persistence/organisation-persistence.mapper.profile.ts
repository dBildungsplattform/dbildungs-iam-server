import { Mapper, MappingProfile, createMap, forMember, mapFrom } from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationEntity } from './organisation.entity.js';

@Injectable()
export class OrganisationPersistenceMapperProfile extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(mapper, OrganisationDo, OrganisationEntity);
            createMap(
                mapper,
                OrganisationEntity,
                OrganisationDo,
                forMember(
                    (dest: OrganisationDo<true>) => dest.id,
                    mapFrom((src: OrganisationEntity) => src.id),
                ),
            );
        };
    }
}
