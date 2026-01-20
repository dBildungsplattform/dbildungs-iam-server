import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { uniq } from 'lodash-es';
import { Person } from '../../../person/domain/person.js';
import { RequiredExternalPkData } from '../authentication.controller.js';
import { UserExeternalDataResponseItslearning } from './user-externaldata-itslearning.response.js';
import { UserExeternalDataResponseOnlineDateiablage } from './user-externaldata-onlinedateiablage.response.js';
import { UserExeternalDataResponseOpshPk } from './user-externaldata-opsh-pk.response.js';
import { UserExeternalDataResponseOpsh } from './user-externaldata-opsh.response.js';
import { NewOxParams, OldOxParams, UserExternalDataResponseOx } from './user-externaldata-ox.response.js';
import { UserExeternalDataResponseVidis } from './user-externaldata-vidis.response.js';
import { UserExternaldataWorkflowAggregate } from '../../domain/user-extenaldata.workflow.js';
import { PersonenkontextErweitertVirtualEntityLoaded } from '../../../personenkontext/persistence/dbiam-personenkontext.repo.js';

export class UserExternalDataResponse {
    @ApiPropertyOptional({ type: UserExternalDataResponseOx })
    public ox?: UserExternalDataResponseOx;

    @ApiProperty({ type: UserExeternalDataResponseItslearning })
    public itslearning: UserExeternalDataResponseItslearning;

    @ApiProperty({ type: UserExeternalDataResponseVidis })
    public vidis: UserExeternalDataResponseVidis;

    @ApiProperty({ type: UserExeternalDataResponseOpsh })
    public opsh: UserExeternalDataResponseOpsh;

    @ApiProperty({ type: UserExeternalDataResponseOnlineDateiablage })
    public onlineDateiablage: UserExeternalDataResponseOnlineDateiablage;

    private constructor(
        ox: UserExternalDataResponseOx | undefined,
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
        contextParams: OldOxParams | NewOxParams | undefined,
    ): UserExternalDataResponse {
        const ox: Option<UserExternalDataResponseOx> =
            contextParams && UserExternalDataResponseOx.createNew(contextParams);
        const itslearning: UserExeternalDataResponseItslearning = new UserExeternalDataResponseItslearning(person.id);
        const mergedExternalPkData: RequiredExternalPkData[] = UserExternaldataWorkflowAggregate.mergeServiceProviders(
            externalPkData,
            personenKontextErweiterungen,
        );
        const externalPkDataWithVidisAngebotId: RequiredExternalPkData[] =
            UserExternaldataWorkflowAggregate.getExternalPkDataWithSpWithVidisAngebotId(mergedExternalPkData);
        const vidis: UserExeternalDataResponseVidis = new UserExeternalDataResponseVidis(
            person.id,
            person.vorname,
            person.familienname,
            externalPkData[0]?.rollenart,
            person.email,
            uniq(externalPkDataWithVidisAngebotId.map((pk: RequiredExternalPkData) => pk.kennung).filter(Boolean)),
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

        return new UserExternalDataResponse(ox, itslearning, vidis, opsh, onlineDateiablage);
    }
}
