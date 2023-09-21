import { Mapper, MappingProfile, createMap, forMember, ignore, mapFrom } from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { CreateOrganisationBodyParams } from './create-organisation.body.params.js';
import { CreateOrganisationDto } from './create-organisation.dto.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationResponse } from './organisation.response.js';

@Injectable()
export class OrganisationApiMapperProfile extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(
                mapper,
                CreateOrganisationBodyParams,
                CreateOrganisationDto,
                forMember((dest: CreateOrganisationDto) => dest.id, ignore()),
            );
            createMap(mapper, CreateOrganisationDto, OrganisationDo<false>);
            createMap(
                mapper,
                OrganisationDo<true>,
                CreateOrganisationDto,
                forMember(
                    (dest: CreateOrganisationDto) => dest.id,
                    mapFrom((src: OrganisationDo<true>) => src.id),
                ),
            );
            createMap(mapper, CreateOrganisationDto, OrganisationResponse);
        };
    }
}
