import { createMap, forMember, ignore, mapFrom, Mapper, MappingProfile } from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { PersonDo } from '../domain/person.do.js';
import { PersonenkontextDo } from '../../personenkontext/domain/personenkontext.do.js';
import { CreatePersonBodyParams } from './create-person.body.params.js';
import { CreatePersonDto } from './create-person.dto.js';
import { CreatePersonenkontextBodyParams } from '../../personenkontext/api/param/create-personenkontext.body.params.js';
import { CreatePersonenkontextDto } from '../../personenkontext/api/create-personenkontext.dto.js';
import { CreatedPersonenkontextDto } from '../../personenkontext/api/created-personenkontext.dto.js';
import { FindPersonenkontextByIdDto } from '../../personenkontext/api/find-personenkontext-by-id.dto.js';
import { FindPersonenkontextByIdParams } from '../../personenkontext/api/param/find-personenkontext-by-id.params.js';
import { FindPersonenkontextDto } from '../../personenkontext/api/find-personenkontext.dto.js';
import { LoeschungDto } from './loeschung.dto.js';
import { PersonendatensatzResponseAutomapper } from './personendatensatz.response-automapper.js';
import { PersonenkontextQueryParams } from '../../personenkontext/api/param/personenkontext-query.params.js';
import { PersonenkontextResponse } from '../../personenkontext/api/response/personenkontext.response.js';
import { UpdatePersonenkontextBodyParams } from '../../personenkontext/api/param/update-personenkontext.body.params.js';
import { UpdatePersonenkontextDto } from '../../personenkontext/api/update-personenkontext.dto.js';
import { DeleteRevisionBodyParams } from './delete-revision.body.params.js';
import { DeletePersonenkontextDto } from '../../personenkontext/api/delete-personkontext.dto.js';
import { CreatedPersonenkontextOrganisation } from '../../personenkontext/api/created-personenkontext-organisation.js';

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
                forMember((dest: PersonendatensatzResponseAutomapper) => dest.personenkontexte, ignore()),
            );

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
