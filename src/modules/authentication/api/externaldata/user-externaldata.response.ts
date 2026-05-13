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
import { ErweiterterServiceProviderForPK } from '../../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { UserExternalDataResponseIqshHelpdesk } from './user-externaldata-iqshhelpdesk.response.js';
import { UserExternalDataResponseIqshHelpdeskPk } from './user-externaldata-iqshhelpdesk-pk.response.js';

export class UserExternalDataResponse {
    //optional, um den Zugriff auf OX zu verhindern, falls kein Lehrerkontext mehr an der Person hängt
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

    @ApiProperty({ type: UserExternalDataResponseIqshHelpdesk })
    public iqshHelpdesk: UserExternalDataResponseIqshHelpdesk;

    private constructor(
        ox: UserExternalDataResponseOx | undefined,
        itslearning: UserExeternalDataResponseItslearning,
        vidis: UserExeternalDataResponseVidis,
        opsh: UserExeternalDataResponseOpsh,
        onlineDateiablage: UserExeternalDataResponseOnlineDateiablage,
        iqshHelpdesk: UserExternalDataResponseIqshHelpdesk,
    ) {
        this.ox = ox;
        this.itslearning = itslearning;
        this.vidis = vidis;
        this.opsh = opsh;
        this.onlineDateiablage = onlineDateiablage;
        this.iqshHelpdesk = iqshHelpdesk;
    }

    public static createNew(
        person: Person<true>,
        externalPkData: RequiredExternalPkData[],
        erweiterteSP: ErweiterterServiceProviderForPK[],
        contextParams: OldOxParams | NewOxParams | undefined,
    ): UserExternalDataResponse {
        const ox: Option<UserExternalDataResponseOx> =
            contextParams && UserExternalDataResponseOx.createNew(contextParams);
        const itslearning: UserExeternalDataResponseItslearning = new UserExeternalDataResponseItslearning(person.id);
        const mergedExternalPkData: RequiredExternalPkData[] = UserExternaldataWorkflowAggregate.mergeServiceProviders(
            externalPkData,
            erweiterteSP,
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
        const iqshHelpdesk: UserExternalDataResponseIqshHelpdesk = new UserExternalDataResponseIqshHelpdesk(
            person.vorname,
            person.familienname,
            externalPkData.map(
                (pk: RequiredExternalPkData) => new UserExternalDataResponseIqshHelpdeskPk(pk.rolleId, pk.kennung),
            ),
            person.email,
        );

        return new UserExternalDataResponse(ox, itslearning, vidis, opsh, onlineDateiablage, iqshHelpdesk);
    }
}
