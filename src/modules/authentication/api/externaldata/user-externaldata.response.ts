import { ApiProperty } from '@nestjs/swagger';
import { UserExeternalDataResponseItslearning } from './user-externaldata-itslearning.response.js';
import { UserExeternalDataResponseOnlineDateiablage } from './user-externaldata-onlinedateiablage.response.js';
import { UserExeternalDataResponseOpsh } from './user-externaldata-opsh.response.js';
import { UserExeternalDataResponseOx } from './user-externaldata-ox.response.js';
import { UserExeternalDataResponseVidis } from './user-externaldata-vidis.response.js';
import { UserExeternalDataResponseOpshPk } from './user-externaldata-opsh-pk.response.js';
import { RequiredExternalPkData } from '../authentication.controller.js';
import { Person } from '../../../person/domain/person.js';

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
        contextID: string,
    ): UserExeternalDataResponse {
        const ox: UserExeternalDataResponseOx = new UserExeternalDataResponseOx(person.username!, contextID);
        const itslearning: UserExeternalDataResponseItslearning = new UserExeternalDataResponseItslearning(person.id);
        const vidis: UserExeternalDataResponseVidis = new UserExeternalDataResponseVidis(
            person.id,
            person.vorname,
            person.familienname,
            externalPkData[0]?.rollenart,
            person.email,
            externalPkData.map((pk: RequiredExternalPkData) => pk.kennung),
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
}
