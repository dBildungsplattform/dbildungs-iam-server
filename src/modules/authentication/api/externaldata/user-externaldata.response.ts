import { ApiProperty } from '@nestjs/swagger';
import { Person } from '../../../person/domain/person.js';
import { RequiredExternalPkData } from '../authentication.controller.js';
import { UserExeternalDataResponseItslearning } from './user-externaldata-itslearning.response.js';
import { UserExeternalDataResponseOnlineDateiablage } from './user-externaldata-onlinedateiablage.response.js';
import { UserExeternalDataResponseOpshPk } from './user-externaldata-opsh-pk.response.js';
import { UserExeternalDataResponseOpsh } from './user-externaldata-opsh.response.js';
import { UserExeternalDataResponseOx } from './user-externaldata-ox.response.js';
import { UserExeternalDataResponseVidis } from './user-externaldata-vidis.response.js';
import { ServiceProviderEntity } from '../../../service-provider/repo/service-provider.entity.js';
import { PersonenkontextErweitertVirtualEntityLoaded } from '../../../rolle/repo/rollenerweiterung.repo.js';
import { Loaded } from '@mikro-orm/core';

export class UserExeternalDataResponse {
    @ApiProperty({ type: UserExeternalDataResponseOx })
    public ox: UserExeternalDataResponseOx;

    @ApiProperty({ type: UserExeternalDataResponseItslearning })
    public itslearning: UserExeternalDataResponseItslearning;

    @ApiProperty({ type: UserExeternalDataResponseVidis })
    public vidis: UserExeternalDataResponseVidis;

    @ApiProperty({ type: UserExeternalDataResponseOpsh })
    public opsh: UserExeternalDataResponseOpsh;

    @ApiProperty({ type: UserExeternalDataResponseOnlineDateiablage })
    public onlineDateiablage: UserExeternalDataResponseOnlineDateiablage;

    private constructor(
        ox: UserExeternalDataResponseOx,
        itslearning: UserExeternalDataResponseItslearning,
        vidis: UserExeternalDataResponseVidis,
        opsh: UserExeternalDataResponseOpsh,
        onlineDateiablage: UserExeternalDataResponseOnlineDateiablage,
    ) {
        this.ox = ox;
        this.itslearning = itslearning;
        this.vidis = vidis;
        this.opsh = opsh;
        this.onlineDateiablage = onlineDateiablage;
    }

    public static createNew(
        person: Person<true>,
        externalPkData: RequiredExternalPkData[],
        personenKontextErweiterungen: PersonenkontextErweitertVirtualEntityLoaded[],
        contextID: string,
    ): UserExeternalDataResponse {
        const ox: UserExeternalDataResponseOx = new UserExeternalDataResponseOx(person.username!, contextID);
        const itslearning: UserExeternalDataResponseItslearning = new UserExeternalDataResponseItslearning(person.id);
        const mergedExternalPkData: RequiredExternalPkData[] = UserExeternalDataResponse.mergeServiceProviders(
            externalPkData,
            personenKontextErweiterungen,
        );
        const externalPkDataWithVidisAngebotId: RequiredExternalPkData[] =
            UserExeternalDataResponse.getExternalPkDataWithSpWithVidisAngebotId(mergedExternalPkData);
        const vidis: UserExeternalDataResponseVidis = new UserExeternalDataResponseVidis(
            person.id,
            person.vorname,
            person.familienname,
            externalPkData[0]?.rollenart,
            person.email,
            externalPkDataWithVidisAngebotId
                .map((pk: RequiredExternalPkData) => pk.kennung)
                .filter((k: string, i: number, arr: string[]) => !!k && arr.indexOf(k) === i),
        );
        const opsh: UserExeternalDataResponseOpsh = new UserExeternalDataResponseOpsh(
            person.vorname,
            person.familienname,
            externalPkData.map(
                (pk: RequiredExternalPkData) => new UserExeternalDataResponseOpshPk(pk.rollenart, pk.kennung),
            ),
            person.email,
        );
        const onlineDateiablage: UserExeternalDataResponseOnlineDateiablage =
            new UserExeternalDataResponseOnlineDateiablage(person.id);

        return new UserExeternalDataResponse(ox, itslearning, vidis, opsh, onlineDateiablage);
    }

    private static mergeServiceProviders(
        externalPkData: RequiredExternalPkData[],
        personenKontextErweiterungen: PersonenkontextErweitertVirtualEntityLoaded[],
    ): RequiredExternalPkData[] {
        const erweiterungenMap: Map<string, ServiceProviderEntity[]> = new Map<string, ServiceProviderEntity[]>();
        for (const erweiterung of personenKontextErweiterungen) {
            const pkId: string = erweiterung.personenkontext.unwrap().id;
            const sp: Loaded<ServiceProviderEntity & object, never, never, never> =
                erweiterung.serviceProvider.unwrap();
            if (!erweiterungenMap.has(pkId)) {
                erweiterungenMap.set(pkId, []);
            }
            erweiterungenMap.get(pkId)?.push(sp);
        }

        return externalPkData.map((pk: RequiredExternalPkData) => {
            const extraSp: ServiceProviderEntity[] = erweiterungenMap.get(pk.pkId) ?? [];
            const mergedSp: ServiceProviderEntity[] = [...pk.serviceProvider, ...extraSp];
            const uniqueSp: ServiceProviderEntity[] = Array.from(new Set(mergedSp));

            return {
                ...pk,
                serviceProvider: uniqueSp,
            };
        });
    }

    private static getExternalPkDataWithSpWithVidisAngebotId(
        externalPkData: RequiredExternalPkData[],
    ): RequiredExternalPkData[] {
        return externalPkData
            .filter((pk: RequiredExternalPkData): pk is RequiredExternalPkData =>
                pk.serviceProvider.some((sp: ServiceProviderEntity) => Boolean(sp.vidisAngebotId)),
            )
            .filter((item: RequiredExternalPkData | undefined): item is RequiredExternalPkData => item !== undefined);
    }
}
