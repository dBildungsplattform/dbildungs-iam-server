import {
    Converter,
    Mapper,
    MappingProfile,
    convertUsing,
    createMap,
    forMember,
    ignore,
    mapFrom,
} from '@automapper/core';
import { AutomapperProfile, getMapperToken } from '@automapper/nestjs';
import { Inject, Injectable } from '@nestjs/common';
import { UserDo } from '../../keycloak-administration/index.js';
import { OrganisationDo } from '../../organisation/domain/organisation.do.js';
import { CreatePersonDto } from '../domain/create-person.dto.js';
import { PersonDo } from '../domain/person.do.js';
import { Gender, TrustLevel } from '../domain/person.enums.js';
import { PersonenkontextDo } from '../domain/personenkontext.do.js';
import { CreatePersonBodyParams } from './create-person.body.params.js';
import { CreatePersonenkontextBodyParams } from './create-personenkontext.body.params.js';
import { CreatePersonenkontextDto } from './create-personenkontext.dto.js';
import { CreatedPersonenkontextOrganisationDto } from './created-personenkontext-organisation.dto.js';
import { CreatedPersonenkontextDto } from './created-personenkontext.dto.js';
import { FindPersonendatensatzDto } from './find-personendatensatz.dto.js';
import { FindPersonenkontextByIdDto } from './find-personenkontext-by-id.dto.js';
import { FindPersonenkontextByIdParams } from './find-personenkontext-by-id.params.js';
import { FindPersonenkontextDto } from './find-personenkontext.dto.js';
import { LoeschungDto } from './loeschung.dto.js';
import { LoeschungResponse } from './loeschung.response.js';
import { PersonBirthParams } from './person-birth.params.js';
import { PersonGeburtDto } from './person-geburt.dto.js';
import { PersonNameDto } from './person-name.dto.js';
import { PersonNameParams } from './person-name.params.js';
import { PersonDto } from './person.dto.js';
import { PersonGender, PersonTrustLevel } from './person.enums.js';
import { PersonResponse } from './person.response.js';
import { PersonenQueryParams, SichtfreigabeType } from './personen-query.param.js';
import { PersonendatensatzDto } from './personendatensatz.dto.js';
import { PersonendatensatzResponse } from './personendatensatz.response.js';
import { PersonenkontextQueryParams } from './personenkontext-query.params.js';
import { PersonenkontextDto } from './personenkontext.dto.js';
import { PersonenkontextResponse } from './personenkontext.response.js';

export const personGenderToGenderConverter: Converter<PersonGender, Gender> = {
    convert(source: PersonGender): Gender {
        switch (source) {
            case PersonGender.DIVERSE:
                return Gender.DIVERSE;
            case PersonGender.FEMALE:
                return Gender.FEMALE;
            case PersonGender.MALE:
                return Gender.MALE;
            default:
                return Gender.UNKNOWN;
        }
    },
};

export const personTrustLevelToTrustLevelConverter: Converter<PersonTrustLevel, TrustLevel> = {
    convert(source: PersonTrustLevel): TrustLevel {
        switch (source) {
            case PersonTrustLevel.NONE:
                return TrustLevel.NONE;
            case PersonTrustLevel.TRUSTED:
                return TrustLevel.TRUSTED;
            case PersonTrustLevel.VERIFIED:
                return TrustLevel.VERIFIED;
            default:
                return TrustLevel.UNKNOWN;
        }
    },
};

export const personVisibilityToBooleanConverter: Converter<SichtfreigabeType, boolean> = {
    convert(source: SichtfreigabeType) {
        switch (source) {
            case SichtfreigabeType.JA:
                return true;
            case SichtfreigabeType.NEIN:
            default:
                return false;
        }
    },
};

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
                    (dest: CreatePersonDto) => dest.client,
                    mapFrom((src: CreatePersonBodyParams) => src.mandant),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.mainOrganization,
                    mapFrom((src: CreatePersonBodyParams) => src.stammorganisation),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.lastName,
                    mapFrom((src: CreatePersonBodyParams) => src.name.familienname),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.firstName,
                    mapFrom((src: CreatePersonBodyParams) => src.name.vorname),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.initialsLastName,
                    mapFrom((src: CreatePersonBodyParams) => src.name.initialenfamilienname),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.initialsFirstName,
                    mapFrom((src: CreatePersonBodyParams) => src.name.initialenvorname),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.nickName,
                    mapFrom((src: CreatePersonBodyParams) => src.name.rufname),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.birthDate,
                    mapFrom((src: CreatePersonBodyParams) => src.geburt.datum),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.birthPlace,
                    mapFrom((src: CreatePersonBodyParams) => src.geburt.geburtsort),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.localization,
                    mapFrom((src: CreatePersonBodyParams) => src.lokalisierung),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.isInformationBlocked,
                    mapFrom((src: CreatePersonBodyParams) => src.auskunftssperre),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.gender,
                    convertUsing(personGenderToGenderConverter, (src: CreatePersonBodyParams) => src.geschlecht),
                ),
                forMember(
                    (dest: CreatePersonDto) => dest.trustLevel,
                    convertUsing(
                        personTrustLevelToTrustLevelConverter,
                        (src: CreatePersonBodyParams) => src.vertrauensstufe,
                    ),
                ),
            );

            createMap(
                mapper,
                CreatePersonDto,
                PersonDo<boolean>,
                forMember((dest: PersonDo<boolean>) => dest.id, ignore()),
                forMember((dest: PersonDo<boolean>) => dest.createdAt, ignore()),
                forMember((dest: PersonDo<boolean>) => dest.updatedAt, ignore()),
                forMember((dest: PersonDo<boolean>) => dest.keycloakUserId, ignore()),
            );

            createMap(
                mapper,
                PersonDo,
                PersonendatensatzResponse,
                forMember(
                    (dest: PersonendatensatzResponse) => dest.person.id,
                    mapFrom((src: PersonDo<true>) => src.id),
                ),
                forMember(
                    (dest: PersonendatensatzResponse) => dest.person.mandant,
                    mapFrom((src: PersonDo<true>) => src.client),
                ),
                forMember(
                    (dest: PersonendatensatzResponse) => dest.person.referrer,
                    mapFrom((src: PersonDo<true>) => src.referrer),
                ),
                forMember(
                    (dest: PersonendatensatzResponse) => dest.person.name.vorname,
                    mapFrom((src: PersonDo<true>) => src.firstName),
                ),
                forMember(
                    (dest: PersonendatensatzResponse) => dest.person.name.rufname,
                    mapFrom((src: PersonDo<true>) => src.nickName),
                ),
                forMember(
                    (dest: PersonendatensatzResponse) => dest.person.name.familienname,
                    mapFrom((src: PersonDo<true>) => src.lastName),
                ),
                forMember(
                    (dest: PersonendatensatzResponse) => dest.person.name.initialenvorname,
                    mapFrom((src: PersonDo<true>) => src.initialsFirstName),
                ),
                forMember(
                    (dest: PersonendatensatzResponse) => dest.person.name.initialenfamilienname,
                    mapFrom((src: PersonDo<true>) => src.initialsLastName),
                ),
                forMember(
                    (dest: PersonendatensatzResponse) => dest.person.name.sortierindex,
                    mapFrom((src: PersonDo<true>) => src.nameSortIndex),
                ),
                forMember(
                    (dest: PersonendatensatzResponse) => dest.person.geburt.datum,
                    mapFrom((src: PersonDo<true>) => src.birthDate),
                ),
                forMember(
                    (dest: PersonendatensatzResponse) => dest.person.geburt.geburtsort,
                    mapFrom((src: PersonDo<true>) => src.birthPlace),
                ),
                forMember(
                    (dest: PersonendatensatzResponse) => dest.person.vertrauensstufe,
                    mapFrom((src: PersonDo<true>) => src.trustLevel),
                ),
                forMember(
                    (dest: PersonendatensatzResponse) => dest.person.geschlecht,
                    mapFrom((src: PersonDo<true>) => src.gender),
                ),
                forMember(
                    (dest: PersonendatensatzResponse) => dest.person.lokalisierung,
                    mapFrom((src: PersonDo<true>) => src.localization),
                ),
                forMember(
                    (dest: PersonendatensatzResponse) => dest.person.stammorganisation,
                    mapFrom((src: PersonDo<true>) => src.mainOrganization),
                ),
                forMember(
                    (dest: PersonendatensatzResponse) => dest.person.name.anrede,
                    mapFrom((src: PersonDo<true>) => src.nameSalutation),
                ),
                forMember(
                    (dest: PersonendatensatzResponse) => dest.person.name.namenssuffix,
                    mapFrom((src: PersonDo<true>) => src.nameSuffix),
                ),
                forMember(
                    (dest: PersonendatensatzResponse) => dest.person.name.namenspraefix,
                    mapFrom((src: PersonDo<true>) => src.namePrefix),
                ),
            );

            createMap(
                mapper,
                PersonenQueryParams,
                FindPersonendatensatzDto,
                forMember(
                    (dest: FindPersonendatensatzDto) => dest.vorname,
                    mapFrom((src: PersonenQueryParams) => src.vorname),
                ),
                forMember(
                    (dest: FindPersonendatensatzDto) => dest.familienname,
                    mapFrom((src: PersonenQueryParams) => src.familienname),
                ),
                forMember(
                    (dest: FindPersonendatensatzDto) => dest.referrer,
                    mapFrom((src: PersonenQueryParams) => src.referrer),
                ),
            );

            createMap(
                mapper,
                FindPersonendatensatzDto,
                PersonDo<false>,
                forMember(
                    (dest: PersonDo<false>) => dest.lastName,
                    mapFrom((src: FindPersonendatensatzDto) => src.familienname),
                ),
                forMember(
                    (dest: PersonDo<false>) => dest.firstName,
                    mapFrom((src: FindPersonendatensatzDto) => src.vorname),
                ),
                forMember(
                    (dest: PersonDo<false>) => dest.referrer,
                    mapFrom((src: FindPersonendatensatzDto) => src.referrer),
                ),
                forMember((dest: PersonDo<false>) => dest.id, ignore()),
                forMember((dest: PersonDo<false>) => dest.createdAt, ignore()),
                forMember((dest: PersonDo<false>) => dest.updatedAt, ignore()),
                forMember((dest: PersonDo<false>) => dest.keycloakUserId, ignore()),
                forMember((dest: PersonDo<false>) => dest.client, ignore()),
                forMember((dest: PersonDo<false>) => dest.mainOrganization, ignore()),
                forMember((dest: PersonDo<false>) => dest.initialsLastName, ignore()),
                forMember((dest: PersonDo<false>) => dest.initialsFirstName, ignore()),
                forMember((dest: PersonDo<false>) => dest.nickName, ignore()),
                forMember((dest: PersonDo<false>) => dest.nameTitle, ignore()),
                forMember((dest: PersonDo<false>) => dest.nameSalutation, ignore()),
                forMember((dest: PersonDo<false>) => dest.namePrefix, ignore()),
                forMember((dest: PersonDo<false>) => dest.nameSuffix, ignore()),
                forMember((dest: PersonDo<false>) => dest.nameSortIndex, ignore()),
                forMember((dest: PersonDo<false>) => dest.birthDate, ignore()),
                forMember((dest: PersonDo<false>) => dest.birthPlace, ignore()),
                forMember((dest: PersonDo<false>) => dest.gender, ignore()),
                forMember((dest: PersonDo<false>) => dest.localization, ignore()),
                forMember((dest: PersonDo<false>) => dest.trustLevel, ignore()),
                forMember((dest: PersonDo<false>) => dest.isInformationBlocked, ignore()),
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
                PersonenkontextDo<boolean>,
                forMember((dest: PersonenkontextDo<boolean>) => dest.id, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.createdAt, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.updatedAt, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.mandant, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.organisation, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.loeschungZeitpunkt, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.revision, ignore()),
            );

            createMap(
                mapper,
                PersonenkontextDo,
                CreatedPersonenkontextDto,
                forMember(
                    (dest: PersonenkontextDto) => dest.loeschung,
                    mapFrom(
                        (src: PersonenkontextDo<boolean>) => new LoeschungDto({ zeitpunkt: src.loeschungZeitpunkt }),
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
                forMember((dest: PersonenkontextDo<boolean>) => dest.organisation, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.jahrgangsstufe, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.loeschungZeitpunkt, ignore()),
                forMember((dest: PersonenkontextDo<boolean>) => dest.revision, ignore()),
                forMember(
                    (dest: PersonenkontextDo<boolean>) => dest.id,
                    mapFrom((src: FindPersonenkontextDto) => src.personId),
                ),
                forMember(
                    (dest: PersonenkontextDo<boolean>) => dest.sichtfreigabe,
                    convertUsing(
                        personVisibilityToBooleanConverter,
                        (src: FindPersonenkontextDto) => src.sichtfreigabe,
                    ),
                ),
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
                                vorname: src.firstName,
                                familienname: src.lastName,
                                initialenfamilienname: src.initialsLastName,
                                initialenvorname: src.initialsFirstName,
                                rufname: src.nickName,
                                title: src.nameTitle,
                                anrede: src.nameSalutation,
                                namenspraefix: src.namePrefix,
                                namenssuffix: src.nameSuffix,
                                sortierindex: src.nameSortIndex,
                            }),
                    ),
                ),
                forMember(
                    (dest: PersonDto) => dest.geburt,
                    mapFrom(
                        (src: PersonDo<boolean>) =>
                            new PersonGeburtDto({ datum: src.birthDate, geburtsort: src.birthPlace }),
                    ),
                ),
                forMember(
                    (dest: PersonDto) => dest.geschlecht,
                    mapFrom((src: PersonDo<boolean>) => src.gender),
                ),
                forMember(
                    (dest: PersonDto) => dest.stammorganisation,
                    mapFrom((src: PersonDo<boolean>) => src.mainOrganization),
                ),
                forMember(
                    (dest: PersonDto) => dest.lokalisierung,
                    mapFrom((src: PersonDo<boolean>) => src.localization),
                ),
                forMember(
                    (dest: PersonDto) => dest.vertrauensstufe,
                    mapFrom((src: PersonDo<boolean>) => src.trustLevel),
                ),
            );

            createMap(mapper, LoeschungDto, LoeschungResponse);

            createMap(mapper, PersonenkontextDto, PersonenkontextResponse);

            createMap(mapper, PersonDto, PersonResponse);

            createMap(mapper, PersonNameDto, PersonNameParams);

            createMap(mapper, PersonGeburtDto, PersonBirthParams);

            createMap(mapper, PersonendatensatzDto, PersonendatensatzResponse);
        };
    }
}
