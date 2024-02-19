import { Mapper, MappingProfile, createMap, forMember, mapFrom, ignore } from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { CreateOrganisationBodyParams } from './create-organisation.body.params.js';
import { CreateOrganisationDto } from './create-organisation.dto.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationResponse } from './organisation.response.js';
import { CreatedOrganisationDto } from './created-organisation.dto.js';
import { FindOrganisationQueryParams } from './find-organisation-query.param.js';
import { FindOrganisationDto } from './find-organisation.dto.js';
import { UpdateOrganisationBodyParams } from './update-organisation.body.params.js';
import { UpdateOrganisationDto } from './update-organisation.dto.js';
import { UpdatedOrganisationDto } from './updated-organisation.dto.js';

@Injectable()
export class OrganisationApiMapperProfile extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(mapper, CreateOrganisationBodyParams, CreateOrganisationDto);
            createMap(
                mapper,
                UpdateOrganisationBodyParams,
                UpdateOrganisationDto,
                forMember((dest: UpdateOrganisationDto) => dest.id, ignore()),
            );
            createMap(
                mapper,
                CreateOrganisationDto,
                OrganisationDo<false>,
                forMember((dest: OrganisationDo<boolean>) => dest.id, ignore()),
                forMember((dest: OrganisationDo<boolean>) => dest.createdAt, ignore()),
                forMember((dest: OrganisationDo<boolean>) => dest.updatedAt, ignore()),
            );
            createMap(
                mapper,
                UpdateOrganisationDto,
                OrganisationDo<false>,
                forMember((dest: OrganisationDo<boolean>) => dest.id, ignore()),
                forMember((dest: OrganisationDo<boolean>) => dest.createdAt, ignore()),
                forMember((dest: OrganisationDo<boolean>) => dest.updatedAt, ignore()),
            );
            createMap(
                mapper,
                OrganisationDo<true>,
                CreatedOrganisationDto,
                forMember(
                    (dest: CreatedOrganisationDto) => dest.id,
                    mapFrom((src: OrganisationDo<true>) => src.id),
                ),
            );
            createMap(
                mapper,
                OrganisationDo<true>,
                UpdatedOrganisationDto,
                forMember(
                    (dest: UpdatedOrganisationDto) => dest.id,
                    mapFrom((src: OrganisationDo<true>) => src.id),
                ),
            );
            createMap(mapper, CreatedOrganisationDto, OrganisationResponse);
            createMap(mapper, UpdatedOrganisationDto, OrganisationResponse);
            createMap(
                mapper,
                OrganisationDo,
                OrganisationResponse,
                forMember(
                    (dest: OrganisationResponse) => dest.id,
                    mapFrom((src: OrganisationDo<true>) => src.id),
                ),
            );
            createMap(mapper, FindOrganisationQueryParams, FindOrganisationDto);
            createMap(
                mapper,
                FindOrganisationDto,
                OrganisationDo,
                forMember((dest: OrganisationDo<boolean>) => dest.id, ignore()),
                forMember((dest: OrganisationDo<boolean>) => dest.createdAt, ignore()),
                forMember((dest: OrganisationDo<boolean>) => dest.updatedAt, ignore()),
                forMember((dest: OrganisationDo<boolean>) => dest.namensergaenzung, ignore()),
                forMember((dest: OrganisationDo<boolean>) => dest.kuerzel, ignore()),
                forMember((dest: OrganisationDo<boolean>) => dest.administriertVon, ignore()),
                forMember((dest: OrganisationDo<boolean>) => dest.zugehoerigZu, ignore()),
                forMember((dest: OrganisationDo<boolean>) => dest.traegerschaft, ignore()),
            );
        };
    }
}
