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
import { CreatePersonDto } from '../domain/create-person.dto.js';
import { PersonDo } from '../domain/person.do.js';
import { Gender, TrustLevel } from '../domain/person.enums.js';
import { CreatePersonBodyParams } from './create-person.body.params.js';
import { PersonGender, PersonTrustLevel } from './person.enums.js';
import { PersonResponse } from './person.response.js';
import { AllPersonsQueryParam, VisibilityType } from './persons-query.param.js';
import { FindPersonDTO } from './find-person.dto.js';

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

export const personVisibilityToBooleanConverter: Converter<VisibilityType, boolean> = {
    convert(source: VisibilityType) {
        switch (source) {
            case VisibilityType.JA:
                return true;
            case VisibilityType.NEIN:
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
                    mapFrom((src: CreatePersonBodyParams) => src.sichtfreigabe),
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
            createMap(mapper, CreatePersonDto, PersonDo);
            createMap(
                mapper,
                PersonDo,
                PersonResponse,
                forMember(
                    (dest: PersonResponse) => dest.id,
                    mapFrom((src: PersonDo<true>) => src.id),
                ),
                forMember(
                    (dest: PersonResponse) => dest.mandant,
                    mapFrom((src: PersonDo<true>) => src.client),
                ),
                forMember(
                    (dest: PersonResponse) => dest.name.vorname,
                    mapFrom((src: PersonDo<true>) => src.firstName),
                ),
                forMember(
                    (dest: PersonResponse) => dest.name.familienname,
                    mapFrom((src: PersonDo<true>) => src.lastName),
                ),
                forMember(
                    (dest: PersonResponse) => dest.name.initialenvorname,
                    mapFrom((src: PersonDo<true>) => src.initialsFirstName),
                ),
                forMember(
                    (dest: PersonResponse) => dest.name.initialenfamilienname,
                    mapFrom((src: PersonDo<true>) => src.initialsLastName),
                ),
                forMember(
                    (dest: PersonResponse) => dest.name.sortierindex,
                    mapFrom((src: PersonDo<true>) => src.nameSortIndex),
                ),
                forMember(
                    (dest: PersonResponse) => dest.geburt.datum,
                    mapFrom((src: PersonDo<true>) => src.birthDate),
                ),
                forMember(
                    (dest: PersonResponse) => dest.geburt.geburtsort,
                    mapFrom((src: PersonDo<true>) => src.birthPlace),
                ),
                forMember(
                    (dest: PersonResponse) => dest.vertrauensstufe,
                    mapFrom((src: PersonDo<true>) => src.trustLevel),
                ),
                forMember(
                    (dest: PersonResponse) => dest.geschlecht,
                    mapFrom((src: PersonDo<true>) => src.gender),
                ),
                forMember(
                    (dest: PersonResponse) => dest.lokalisierung,
                    mapFrom((src: PersonDo<true>) => src.localization),
                ),
            );
            createMap(
                mapper,
                AllPersonsQueryParam,
                FindPersonDTO,
                forMember(
                    (dest: FindPersonDTO) => dest.visibility,
                    convertUsing(personVisibilityToBooleanConverter, (src: AllPersonsQueryParam) => src.visibility),
                ),
            );
            createMap(
                mapper,
                FindPersonDTO,
                PersonDo<false>,
                forMember(
                    (dest: PersonDo<false>) => dest.lastName,
                    mapFrom((src: FindPersonDTO) => src.familyName),
                ),
                forMember(
                    (dest: PersonDo<false>) => dest.isInformationBlocked,
                    mapFrom((src: FindPersonDTO) => src.visibility),
                ),
                forMember(
                    (dest: PersonDo<false>) => dest.firstName,
                    mapFrom((src: FindPersonDTO) => src.firstName),
                ),
                forMember(
                    (dest: PersonDo<false>) => dest.referrer,
                    mapFrom((src: FindPersonDTO) => src.referrer),
                ),
                forMember((dest: PersonDo<false>) => dest.id, ignore()),
                forMember((dest: PersonDo<false>) => dest.createdAt, ignore()),
                forMember((dest: PersonDo<false>) => dest.updatedAt, ignore()),
                forMember((dest: PersonDo<false>) => dest.client, ignore()),
                forMember((dest: PersonDo<false>) => dest.mainOrganization, ignore()),
                forMember((dest: PersonDo<false>) => dest.initialsLastName, ignore()),
                forMember((dest: PersonDo<false>) => dest.initialsFirstName, ignore()),
                forMember((dest: PersonDo<false>) => dest.nickName, ignore()),
                forMember((dest: PersonDo<false>) => dest.nameTitle, ignore()),
                forMember((dest: PersonDo<false>) => dest.nameSalutation, ignore()),
                forMember((dest: PersonDo<false>) => dest.namePrefix, ignore()),
                forMember((dest: PersonDo<false>) => dest.nameSortIndex, ignore()),
                forMember((dest: PersonDo<false>) => dest.birthDate, ignore()),
                forMember((dest: PersonDo<false>) => dest.birthPlace, ignore()),
                forMember((dest: PersonDo<false>) => dest.gender, ignore()),
                forMember((dest: PersonDo<false>) => dest.localization, ignore()),
                forMember((dest: PersonDo<false>) => dest.trustLevel, ignore()),
            );
        };
    }
}
