import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { uniq } from 'lodash-es';
import { Person } from '../../../person/domain/person.js';
import { ErweiterterServiceProviderForPK } from '../../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { UserExternaldataWorkflowAggregate } from '../../domain/user-extenaldata.workflow.js';
import { RequiredExternalPkData } from '../authentication.controller.js';
import { UserExternalDataResponseIqshHelpdeskPk } from './user-externaldata-iqshhelpdesk-pk.response.js';
import { UserExternalDataResponseIqshHelpdesk } from './user-externaldata-iqshhelpdesk.response.js';
import { UserExeternalDataResponseItslearning } from './user-externaldata-itslearning.response.js';
import { UserExeternalDataResponseOnlineDateiablage } from './user-externaldata-onlinedateiablage.response.js';
import { UserExeternalDataResponseOpshPk } from './user-externaldata-opsh-pk.response.js';
import { UserExeternalDataResponseOpsh } from './user-externaldata-opsh.response.js';
import { NewOxParams, OldOxParams, UserExternalDataResponseOx } from './user-externaldata-ox.response.js';
import { UserExternalDataResponsePolyteia } from './user-externaldata-polyteia.response.js';
import { UserExeternalDataResponseVidis } from './user-externaldata-vidis.response.js';

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

    @ApiProperty({ type: UserExternalDataResponsePolyteia })
    public polyteia: UserExternalDataResponsePolyteia;

    private constructor(
        ox: UserExternalDataResponseOx | undefined,
        itslearning: UserExeternalDataResponseItslearning,
        vidis: UserExeternalDataResponseVidis,
        opsh: UserExeternalDataResponseOpsh,
        onlineDateiablage: UserExeternalDataResponseOnlineDateiablage,
        iqshHelpdesk: UserExternalDataResponseIqshHelpdesk,
        polyteia: UserExternalDataResponsePolyteia,
    ) {
        this.ox = ox;
        this.itslearning = itslearning;
        this.vidis = vidis;
        this.opsh = opsh;
        this.onlineDateiablage = onlineDateiablage;
        this.iqshHelpdesk = iqshHelpdesk;
        this.polyteia = polyteia;
    }

    public static createNew(
        person: Person<true>,
        externalPkData: RequiredExternalPkData[],
        erweiterteSP: ErweiterterServiceProviderForPK[],
        contextParams: OldOxParams | NewOxParams | undefined,
        email?: string,
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
            email,
            uniq(externalPkDataWithVidisAngebotId.map((pk: RequiredExternalPkData) => pk.kennung).filter(Boolean)),
        );
        const opsh: UserExeternalDataResponseOpsh = new UserExeternalDataResponseOpsh(
            person.vorname,
            person.familienname,
            externalPkData.map(
                (pk: RequiredExternalPkData) => new UserExeternalDataResponseOpshPk(pk.rollenart, pk.kennung),
            ),
            email,
        );
        const onlineDateiablage: UserExeternalDataResponseOnlineDateiablage =
            new UserExeternalDataResponseOnlineDateiablage(person.id);
        const iqshHelpdesk: UserExternalDataResponseIqshHelpdesk = new UserExternalDataResponseIqshHelpdesk(
            person.vorname,
            person.familienname,
            externalPkData.map(
                (pk: RequiredExternalPkData) => new UserExternalDataResponseIqshHelpdeskPk(pk.rolleId, pk.kennung),
            ),
            email,
        );
        const polyteia: UserExternalDataResponsePolyteia = new UserExternalDataResponsePolyteia(
            uniq(externalPkData.map((pk: RequiredExternalPkData) => pk.rollenart)),
        );

        return new UserExternalDataResponse(ox, itslearning, vidis, opsh, onlineDateiablage, iqshHelpdesk, polyteia);
    }
}
