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
import { PersonenQueryParam, SichtfreigabeType } from './personen-query.param.js';
import { FindePersondatensatzDTO } from './finde-persondatensatz-dto.js';
import { Personendatensatz } from './personendatensatz.js';

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
            createMap(mapper, CreatePersonDto, PersonDo);
            createMap(
                mapper,
                PersonDo,
                Personendatensatz,
                forMember(
                    (dest: Personendatensatz) => dest.person.id,
                    mapFrom((src: PersonDo<true>) => src.id),
                ),
                forMember(
                    (dest: Personendatensatz) => dest.person.mandant,
                    mapFrom((src: PersonDo<true>) => src.client),
                ),
                forMember(
                    (dest: Personendatensatz) => dest.person.referrer,
                    mapFrom((src: PersonDo<true>) => src.referrer),
                ),
                forMember(
                    (dest: Personendatensatz) => dest.person.name.vorname,
                    mapFrom((src: PersonDo<true>) => src.firstName),
                ),
                forMember(
                    (dest: Personendatensatz) => dest.person.name.rufname,
                    mapFrom((src: PersonDo<true>) => src.nickName),
                ),
                forMember(
                    (dest: Personendatensatz) => dest.person.name.familienname,
                    mapFrom((src: PersonDo<true>) => src.lastName),
                ),
                forMember(
                    (dest: Personendatensatz) => dest.person.name.initialenvorname,
                    mapFrom((src: PersonDo<true>) => src.initialsFirstName),
                ),
                forMember(
                    (dest: Personendatensatz) => dest.person.name.initialenfamilienname,
                    mapFrom((src: PersonDo<true>) => src.initialsLastName),
                ),
                forMember(
                    (dest: Personendatensatz) => dest.person.name.sortierindex,
                    mapFrom((src: PersonDo<true>) => src.nameSortIndex),
                ),
                forMember(
                    (dest: Personendatensatz) => dest.person.geburt.datum,
                    mapFrom((src: PersonDo<true>) => src.birthDate),
                ),
                forMember(
                    (dest: Personendatensatz) => dest.person.geburt.geburtsort,
                    mapFrom((src: PersonDo<true>) => src.birthPlace),
                ),
                forMember(
                    (dest: Personendatensatz) => dest.person.vertrauensstufe,
                    mapFrom((src: PersonDo<true>) => src.trustLevel),
                ),
                forMember(
                    (dest: Personendatensatz) => dest.person.geschlecht,
                    mapFrom((src: PersonDo<true>) => src.gender),
                ),
                forMember(
                    (dest: Personendatensatz) => dest.person.lokalisierung,
                    mapFrom((src: PersonDo<true>) => src.localization),
                ),
                forMember(
                    (dest: Personendatensatz) => dest.person.stammorganisation,
                    mapFrom((src: PersonDo<true>) => src.mainOrganization),
                ),
                forMember(
                    (dest: Personendatensatz) => dest.person.name.anrede,
                    mapFrom((src: PersonDo<true>) => src.nameSalutation),
                ),
                forMember(
                    (dest: Personendatensatz) => dest.person.name.namenssuffix,
                    mapFrom((src: PersonDo<true>) => src.nameSuffix),
                ),
                forMember(
                    (dest: Personendatensatz) => dest.person.name.namenspraefix,
                    mapFrom((src: PersonDo<true>) => src.namePrefix),
                ),
            );
            createMap(
                mapper,
                PersonenQueryParam,
                FindePersondatensatzDTO,
                forMember(
                    (dest: FindePersondatensatzDTO) => dest.vorname,
                    mapFrom((src: PersonenQueryParam) => src.vorname),
                ),
                forMember(
                    (dest: FindePersondatensatzDTO) => dest.familienname,
                    mapFrom((src: PersonenQueryParam) => src.familienname),
                ),
                forMember(
                    (dest: FindePersondatensatzDTO) => dest.referrer,
                    mapFrom((src: PersonenQueryParam) => src.referrer),
                ),
            );
            createMap(
                mapper,
                FindePersondatensatzDTO,
                PersonDo<false>,
                forMember(
                    (dest: PersonDo<false>) => dest.lastName,
                    mapFrom((src: FindePersondatensatzDTO) => src.familienname),
                ),
                forMember(
                    (dest: PersonDo<false>) => dest.firstName,
                    mapFrom((src: FindePersondatensatzDTO) => src.vorname),
                ),
                forMember(
                    (dest: PersonDo<false>) => dest.referrer,
                    mapFrom((src: FindePersondatensatzDTO) => src.referrer),
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
                forMember((dest: PersonDo<false>) => dest.isInformationBlocked, ignore()),
            );
        };
    }
}
