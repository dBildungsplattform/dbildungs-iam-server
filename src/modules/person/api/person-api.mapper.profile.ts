import { createMap, forMember, ignore, mapFrom, Mapper, MappingProfile } from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { UserDo } from '../../keycloak-administration/index.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonenkontextDo } from '../../personenkontext/domain/personenkontext.do.js';
import { CreatePersonBodyParams } from './create-person.body.params.js';
import { CreatePersonDto } from './create-person.dto.js';
import { CreatePersonenkontextBodyParams } from '../../personenkontext/api/create-personenkontext.body.params.js';
import { CreatePersonenkontextDto } from '../../personenkontext/api/create-personenkontext.dto.js';
import { CreatedPersonenkontextOrganisationDto } from '../../personenkontext/api/created-personenkontext-organisation.dto.js';
import { CreatedPersonenkontextDto } from '../../personenkontext/api/created-personenkontext.dto.js';
import { FindPersonenkontextByIdDto } from '../../personenkontext/api/find-personenkontext-by-id.dto.js';
import { FindPersonenkontextByIdParams } from '../../personenkontext/api/find-personenkontext-by-id.params.js';
import { FindPersonenkontextDto } from '../../personenkontext/api/find-personenkontext.dto.js';
import { LoeschungDto } from './loeschung.dto.js';
import { LoeschungResponse } from './loeschung.response.js';
import { PersonBirthParams } from './person-birth.params.js';
import { PersonGeburtDto } from './person-geburt.dto.js';
import { PersonIdResponse } from './person-id.response.js';
import { PersonNameDto } from './person-name.dto.js';
import { PersonNameParams } from './person-name.params.js';
import { PersonDto } from './person.dto.js';
import { PersonResponseAutomapper } from './person.response-automapper.js';
import { PersonendatensatzDto } from './personendatensatz.dto.js';
import { PersonendatensatzResponseAutomapper } from './personendatensatz.response-automapper.js';
import { PersonenkontextQueryParams } from '../../personenkontext/api/personenkontext-query.params.js';
import { PersonenkontextDto } from '../../personenkontext/api/personenkontext.dto.js';
import { PersonenkontextResponse } from '../../personenkontext/api/personenkontext.response.js';
import { PersonenkontextdatensatzResponse } from '../../personenkontext/api/personenkontextdatensatz.response.js';
import { UpdatePersonenkontextBodyParams } from '../../personenkontext/api/update-personenkontext.body.params.js';
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
                CreatePersonBodyParams,
                CreatePersonDto,
                forMember(
                    (dest: CreatePersonDto) => dest.familienname,
                    mapFrom((src: CreatePersonBodyParams) => src.name.familienname),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.vorname,
                    mapFrom((src: CreatePersonBodyParams) => src.name.vorname),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.nameTitel,
                    mapFrom((src: CreatePersonBodyParams) => src.name.titel),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.nameAnrede,
                    mapFrom((src: CreatePersonBodyParams) => src.name.anrede),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.namePraefix,
                    mapFrom((src: CreatePersonBodyParams) => src.name.namenspraefix),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.nameSuffix,
                    mapFrom((src: CreatePersonBodyParams) => src.name.namenssuffix),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.initialenFamilienname,
                    mapFrom((src: CreatePersonBodyParams) => src.name.initialenfamilienname),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.initialenVorname,
                    mapFrom((src: CreatePersonBodyParams) => src.name.initialenvorname),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.rufname,
                    mapFrom((src: CreatePersonBodyParams) => src.name.rufname),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.geburtsdatum,
                    mapFrom((src: CreatePersonBodyParams) => src.geburt?.datum),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.geburtsort,
                    mapFrom((src: CreatePersonBodyParams) => src.geburt?.geburtsort),
                ),
            );
            createMap(
                mapper,
                CreatePersonDto,
                PersonDo,
                forMember((dest: PersonDo<boolean>) => dest.keycloakUserId, ignore()),
                forMember((dest: PersonDo<boolean>) => dest.id, ignore()),
                forMember((dest: PersonDo<boolean>) => dest.createdAt, ignore()),
                forMember((dest: PersonDo<boolean>) => dest.updatedAt, ignore()),
                forMember((dest: PersonDo<boolean>) => dest.revision, ignore()),
                forMember((dest: PersonDo<boolean>) => dest.mandant, ignore()),
                forMember((dest: PersonDo<boolean>) => dest.personalnummer, ignore()),
            );
            createMap(
                mapper,
                PersonDo,
                PersonendatensatzResponseAutomapper,
                forMember(
                    (dest: PersonendatensatzResponseAutomapper) => dest.person.id,
                    mapFrom((src: PersonDo<true>) => src.id),
                ),
                forMember(
                    (dest: PersonendatensatzResponseAutomapper) => dest.person.mandant,
                    mapFrom((src: PersonDo<true>) => src.mandant),
                ),
                forMember(
                    (dest: PersonendatensatzResponseAutomapper) => dest.person.referrer,
                    mapFrom((src: PersonDo<true>) => src.referrer),
                ),
                forMember(
                    (dest: PersonendatensatzResponseAutomapper) => dest.person.name.vorname,
                    mapFrom((src: PersonDo<true>) => src.vorname),
                ),
                forMember(
                    (dest: PersonendatensatzResponseAutomapper) => dest.person.name.rufname,
                    mapFrom((src: PersonDo<true>) => src.rufname),
                ),
                forMember(
                    (dest: PersonendatensatzResponseAutomapper) => dest.person.name.familienname,
                    mapFrom((src: PersonDo<true>) => src.familienname),
                ),
                forMember(
                    (dest: PersonendatensatzResponseAutomapper) => dest.person.name.initialenvorname,
                    mapFrom((src: PersonDo<true>) => src.initialenVorname),
                ),
                forMember(
                    (dest: PersonendatensatzResponseAutomapper) => dest.person.name.initialenfamilienname,
                    mapFrom((src: PersonDo<true>) => src.initialenFamilienname),
                ),
                forMember(
                    (dest: PersonendatensatzResponseAutomapper) => dest.person.name.sortierindex,
                    mapFrom((src: PersonDo<true>) => src.nameSortierindex),
                ),
                forMember(
                    (dest: PersonendatensatzResponseAutomapper) => dest.person.geburt.datum,
                    mapFrom((src: PersonDo<true>) => src.geburtsdatum),
                ),
                forMember(
                    (dest: PersonendatensatzResponseAutomapper) => dest.person.geburt.geburtsort,
                    mapFrom((src: PersonDo<true>) => src.geburtsort),
                ),
                forMember(
                    (dest: PersonendatensatzResponseAutomapper) => dest.person.vertrauensstufe,
                    mapFrom((src: PersonDo<true>) => src.vertrauensstufe),
                ),
                forMember(
                    (dest: PersonendatensatzResponseAutomapper) => dest.person.geschlecht,
                    mapFrom((src: PersonDo<true>) => src.geschlecht),
                ),
                forMember(
                    (dest: PersonendatensatzResponseAutomapper) => dest.person.lokalisierung,
                    mapFrom((src: PersonDo<true>) => src.lokalisierung),
                ),
                forMember(
                    (dest: PersonendatensatzResponseAutomapper) => dest.person.stammorganisation,
                    mapFrom((src: PersonDo<true>) => src.stammorganisation),
                ),
                forMember(
                    (dest: PersonendatensatzResponseAutomapper) => dest.person.name.anrede,
                    mapFrom((src: PersonDo<true>) => src.nameAnrede),
                ),
                forMember(
                    (dest: PersonendatensatzResponseAutomapper) => dest.person.name.namenssuffix,
                    mapFrom((src: PersonDo<true>) => src.nameSuffix),
                ),
                forMember(
                    (dest: PersonendatensatzResponseAutomapper) => dest.person.name.namenspraefix,
                    mapFrom((src: PersonDo<true>) => src.namePraefix),
                ),
            );

            createMap(mapper, CreatePersonDto, UserDo);

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
                        CreatedPersonenkontextOrganisationDto.new({
                            id: src.organisationId,
                        }),
                    ),
                ),
            );

            createMap(mapper, OrganisationDo, CreatedPersonenkontextOrganisationDto);

            createMap(mapper, CreatedPersonenkontextDto, PersonenkontextResponse);

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
                PersonenkontextDo,
                PersonenkontextDto,
                forMember(
                    (dest: PersonenkontextDto) => dest.loeschung,
                    mapFrom((src: PersonenkontextDo<boolean>) =>
                        src.loeschungZeitpunkt ? new LoeschungDto({ zeitpunkt: src.loeschungZeitpunkt }) : undefined,
                    ),
                ),
                forMember(
                    (dest: PersonenkontextDto) => dest.organisation,
                    mapFrom((src: PersonenkontextDo<boolean>) =>
                        CreatedPersonenkontextOrganisationDto.new({
                            id: src.organisationId,
                        }),
                    ),
                ),
            );

            createMap(
                mapper,
                PersonDo,
                PersonDto,
                forMember(
                    (dest: PersonDto) => dest.name,
                    mapFrom(
                        (src: PersonDo<boolean>) =>
                            new PersonNameDto({
                                vorname: src.vorname,
                                familienname: src.familienname,
                                initialenfamilienname: src.initialenFamilienname,
                                initialenvorname: src.initialenVorname,
                                rufname: src.rufname,
                                titel: src.nameTitel,
                                anrede: src.nameAnrede,
                                namenspraefix: src.namePraefix,
                                namenssuffix: src.nameSuffix,
                                sortierindex: src.nameSortierindex,
                            }),
                    ),
                ),
                forMember(
                    (dest: PersonDto) => dest.geburt,
                    mapFrom(
                        (src: PersonDo<boolean>) =>
                            new PersonGeburtDto({ datum: src.geburtsdatum, geburtsort: src.geburtsort }),
                    ),
                ),
                forMember(
                    (dest: PersonDto) => dest.geschlecht,
                    mapFrom((src: PersonDo<boolean>) => src.geschlecht),
                ),
                forMember(
                    (dest: PersonDto) => dest.stammorganisation,
                    mapFrom((src: PersonDo<boolean>) => src.stammorganisation),
                ),
                forMember(
                    (dest: PersonDto) => dest.lokalisierung,
                    mapFrom((src: PersonDo<boolean>) => src.lokalisierung),
                ),
                forMember(
                    (dest: PersonDto) => dest.vertrauensstufe,
                    mapFrom((src: PersonDo<boolean>) => src.vertrauensstufe),
                ),
                forMember(
                    (dest: PersonDto) => dest.personalnummer,
                    mapFrom((src: PersonDo<boolean>) => src.personalnummer),
                ),
            );

            createMap(mapper, LoeschungDto, LoeschungResponse);

            createMap(mapper, PersonenkontextDto, PersonenkontextResponse);

            createMap(
                mapper,
                PersonDto,
                PersonResponseAutomapper,
                forMember(
                    (dest: PersonResponseAutomapper) => dest.startpasswort,
                    mapFrom((src: PersonDto) => src.startpasswort),
                ),
            );

            createMap(mapper, PersonNameDto, PersonNameParams);

            createMap(mapper, PersonGeburtDto, PersonBirthParams);

            createMap(mapper, PersonendatensatzDto, PersonendatensatzResponseAutomapper);

            createMap(
                mapper,
                PersonenkontextDto,
                PersonenkontextdatensatzResponse,
                forMember(
                    (dest: PersonenkontextdatensatzResponse) => dest.person,
                    mapFrom((src: PersonenkontextDto) => new PersonIdResponse({ id: src.personId })),
                ),
                forMember(
                    (dest: PersonenkontextdatensatzResponse) => dest.personenkontexte,
                    mapFrom((src: PersonenkontextDto) => [
                        mapper.map(src, PersonenkontextDto, PersonenkontextResponse),
                    ]),
                ),
            );

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
