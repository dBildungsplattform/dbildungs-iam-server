import { constructUsing, createMap, forMember, ignore, mapFrom, Mapper, MappingProfile } from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { PersonenkontextDo } from '../../personenkontext/domain/personenkontext.do.js';
import { CreatePersonenkontextBodyParams } from '../../personenkontext/api/param/create-personenkontext.body.params.js';
import { CreatePersonenkontextDto } from '../../personenkontext/api/create-personenkontext.dto.js';
import { CreatedPersonenkontextDto } from '../../personenkontext/api/created-personenkontext.dto.js';
import { FindPersonenkontextByIdDto } from '../../personenkontext/api/find-personenkontext-by-id.dto.js';
import { FindPersonenkontextByIdParams } from '../../personenkontext/api/param/find-personenkontext-by-id.params.js';
import { FindPersonenkontextDto } from '../../personenkontext/api/find-personenkontext.dto.js';
import { LoeschungDto } from './loeschung.dto.js';
import { PersonenkontextQueryParams } from '../../personenkontext/api/param/personenkontext-query.params.js';
import { PersonenkontextResponse } from '../../personenkontext/api/response/personenkontext.response.js';
import { UpdatePersonenkontextBodyParams } from '../../personenkontext/api/param/update-personenkontext.body.params.js';
import { UpdatePersonenkontextDto } from '../../personenkontext/api/update-personenkontext.dto.js';
import { DeleteRevisionBodyParams } from './delete-revision.body.params.js';
import { DeletePersonenkontextDto } from '../../personenkontext/api/delete-personkontext.dto.js';
import { CreatedPersonenkontextOrganisation } from '../../personenkontext/api/created-personenkontext-organisation.js';
import { LoeschungResponse } from './loeschung.response.js';

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
                PersonenkontextDo,
                CreatedPersonenkontextDto,
                forMember(
                    (dest: CreatedPersonenkontextDto) => dest.loeschung,
                    mapFrom((src: PersonenkontextDo<boolean>) =>
                        src.loeschungZeitpunkt ? new LoeschungDto({ zeitpunkt: src.loeschungZeitpunkt }) : undefined,
                    ),
                ),
                forMember(
                    (dest: CreatedPersonenkontextDto) => dest.organisation,
                    mapFrom((src: PersonenkontextDo<boolean>) =>
                        CreatedPersonenkontextOrganisation.new({
                            id: src.organisationId,
                        }),
                    ),
                ),
            );

            createMap(mapper, OrganisationDo, CreatedPersonenkontextOrganisation);

            createMap(
                mapper,
                CreatedPersonenkontextDto,
                PersonenkontextResponse,
                constructUsing(
                    (src: CreatedPersonenkontextDto) =>
                        new PersonenkontextResponse({
                            id: src.id,
                            referrer: src.referrer,
                            mandant: src.mandant,
                            organisation: CreatedPersonenkontextOrganisation.new({
                                id: src.organisation.id,
                            }),
                            personenstatus: src.personenstatus,
                            jahrgangsstufe: src.jahrgangsstufe,
                            sichtfreigabe: src.sichtfreigabe,
                            loeschung: src.loeschung
                                ? LoeschungResponse.new({ zeitpunkt: src.loeschung.zeitpunkt })
                                : undefined,
                            revision: src.revision,
                        }),
                ),
                forMember(
                    (dest: PersonenkontextResponse) => dest.loeschung,
                    mapFrom((src: CreatedPersonenkontextDto) => src.loeschung),
                ),
                forMember((dest: PersonenkontextResponse) => dest.roleName, ignore()),
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
