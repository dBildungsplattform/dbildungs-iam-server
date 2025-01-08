import { ApiProperty } from '@nestjs/swagger';
import { UserExeternalDataResponseItslearning } from './user-externaldata-itslearning.response.js';
import { UserExeternalDataResponseOnlineDateiablage } from './user-externaldata-onlinedateiablage.response.js';
import { UserExeternalDataResponseOpsh } from './user-externaldata-opsh.response.js';
import { UserExeternalDataResponseOx } from './user-externaldata-ox.response.js';
import { UserExeternalDataResponseVidis } from './user-externaldata-vidis.response.js';
import { UserExeternalDataResponseOpshPk } from './user-externaldata-opsh-pk.response.js';
import { RequiredExternalPkData } from '../authentication.controller.js';
import { UserExternaldataWorkflowAggregate } from '../../domain/user-extenaldata.workflow.js';

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

    public static createNew(workflow: UserExternaldataWorkflowAggregate): UserExeternalDataResponse {
        if (!workflow.person) {
            throw new Error(''); //TODO
        }
        if (!workflow.checkedExternalPkData) {
            throw new Error(''); //TODO
        }

        const ox: UserExeternalDataResponseOx = new UserExeternalDataResponseOx(
            workflow.person.referrer!,
            workflow.contextID,
        );
        const itslearning: UserExeternalDataResponseItslearning = new UserExeternalDataResponseItslearning(
            workflow.person.id,
        );
        const vidis: UserExeternalDataResponseVidis = new UserExeternalDataResponseVidis(
            workflow.checkedExternalPkData.map((pk: RequiredExternalPkData) => pk.kennung),
        );
        const opsh: UserExeternalDataResponseOpsh = new UserExeternalDataResponseOpsh(
            workflow.person.vorname,
            workflow.person.familienname,
            workflow.checkedExternalPkData.map(
                (pk: RequiredExternalPkData) => new UserExeternalDataResponseOpshPk(pk.rollenart, pk.kennung),
            ),
            workflow.person.email,
        );
        const onlineDateiablage: UserExeternalDataResponseOnlineDateiablage =
            new UserExeternalDataResponseOnlineDateiablage(workflow.person.id);

        return new UserExeternalDataResponse(ox, itslearning, vidis, opsh, onlineDateiablage);
    }
}
