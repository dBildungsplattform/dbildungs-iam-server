import { Mapper, MappingProfile, createMap, forMember, ignore } from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { CreateOrganisationBodyParams } from './create-organisation.body.params.js';
import { CreateOrganisationDto } from './create-organisation.dto.js';
import { OrganisationDo } from '../domain/organisation.do.js';
import { OrganisationResponseLegacy } from './organisation.response.legacy.js';
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

            createMap(mapper, CreatedOrganisationDto, OrganisationResponseLegacy);
            createMap(mapper, UpdatedOrganisationDto, OrganisationResponseLegacy);

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
