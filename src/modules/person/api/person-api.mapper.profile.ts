import { createMap, forMember, ignore, Mapper, MappingProfile } from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { PersonenkontextDo } from '../../personenkontext/domain/personenkontext.do.js';
import { CreatePersonenkontextBodyParams } from '../../personenkontext/api/param/create-personenkontext.body.params.js';
import { CreatePersonenkontextDto } from '../../personenkontext/api/create-personenkontext.dto.js';
import { FindPersonenkontextByIdDto } from '../../personenkontext/api/find-personenkontext-by-id.dto.js';
import { FindPersonenkontextByIdParams } from '../../personenkontext/api/param/find-personenkontext-by-id.params.js';
import { FindPersonenkontextDto } from '../../personenkontext/api/find-personenkontext.dto.js';
import { PersonenkontextQueryParams } from '../../personenkontext/api/param/personenkontext-query.params.js';
import { UpdatePersonenkontextBodyParams } from '../../personenkontext/api/param/update-personenkontext.body.params.js';
import { UpdatePersonenkontextDto } from '../../personenkontext/api/update-personenkontext.dto.js';
import { DeleteRevisionBodyParams } from './delete-revision.body.params.js';
import { DeletePersonenkontextDto } from '../../personenkontext/api/delete-personkontext.dto.js';

@Injectable()
export class PersonApiMapperProfile extends AutomapperProfile {
    public constructor(@Inject(getMapperToken()) mapper: Mapper) {
        super(mapper);
    }

    public override get profile(): MappingProfile {
        return (mapper: Mapper) => {
            createMap(
                mapper,
                CreatePersonenkontextBodyParams,
                CreatePersonenkontextDto,
                forMember((dest: CreatePersonenkontextDto) => dest.personId, ignore()),
            );

            createMap(
                mapper,
                CreatePersonenkontextDto,
                PersonenkontextDo,
                forMember((dest: PersonenkontextDo<boolean>) => dest.id, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.createdAt, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.updatedAt, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.mandant, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.organisationId, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.loeschungZeitpunkt, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.revision, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.sichtfreigabe, ignore()),
            );

            createMap(
                mapper,
                PersonenkontextQueryParams,
                FindPersonenkontextDto,
                forMember((dest: FindPersonenkontextDto) => dest.personId, ignore()),
            );

            createMap(
                mapper,
                FindPersonenkontextDto,
                PersonenkontextDo,
                forMember((dest: PersonenkontextDo<boolean>) => dest.createdAt, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.updatedAt, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.mandant, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.organisationId, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.jahrgangsstufe, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.loeschungZeitpunkt, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.revision, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.id, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.createdAt, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.updatedAt, ignore()),
            );

            createMap(mapper, FindPersonenkontextByIdParams, FindPersonenkontextByIdDto);

            createMap(
                mapper,
                UpdatePersonenkontextBodyParams,
                UpdatePersonenkontextDto,
                forMember((dest: UpdatePersonenkontextDto) => dest.id, ignore()),
            );

            createMap(
                mapper,
                UpdatePersonenkontextDto,
                PersonenkontextDo<boolean>,
                forMember((dest: PersonenkontextDo<boolean>) => dest.createdAt, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.updatedAt, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.personId, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.mandant, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.organisationId, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.rolle, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.rolleId, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.loeschungZeitpunkt, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.sichtfreigabe, ignore()),
            );

            createMap(
                mapper,
                DeleteRevisionBodyParams,
                DeletePersonenkontextDto,
                forMember((dest: DeletePersonenkontextDto) => dest.id, ignore()),
            );
        };
    }
}
