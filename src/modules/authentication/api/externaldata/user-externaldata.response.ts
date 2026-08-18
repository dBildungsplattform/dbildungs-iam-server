import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { uniq } from 'lodash-es';
import { Person } from '../../../person/domain/person.js';
import { ErweiterterServiceProviderForPK } from '../../../personenkontext/persistence/dbiam-personenkontext.repo.js';
import { RollenArt } from '../../../rolle/domain/rolle.enums.js';
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
        oxParams?: OldOxParams | NewOxParams,
        email?: string,
    ): UserExternalDataResponse {
        const ox: Option<UserExternalDataResponseOx> = oxParams && UserExternalDataResponseOx.createNew(oxParams);

        const itslearning: UserExeternalDataResponseItslearning =
            UserExternalDataResponse.createItslearningResponse(person);

        const vidis: UserExeternalDataResponseVidis = UserExternalDataResponse.createVidisResponse(
            person,
            externalPkData,
            erweiterteSP,
            email,
        );

        const opsh: UserExeternalDataResponseOpsh = UserExternalDataResponse.createOpshResponse(
            externalPkData,
            person,
            email,
        );

        const onlineDateiablage: UserExeternalDataResponseOnlineDateiablage =
            UserExternalDataResponse.createOnlineDateiablageResponse(person);

        const iqshHelpdesk: UserExternalDataResponseIqshHelpdesk = UserExternalDataResponse.createIqshHelpdeskResponse(
            externalPkData,
            person,
            email,
        );

        const polyteia: UserExternalDataResponsePolyteia =
            UserExternalDataResponse.createPolyteiaResponse(externalPkData);

        return new UserExternalDataResponse(ox, itslearning, vidis, opsh, onlineDateiablage, iqshHelpdesk, polyteia);
    }

    private static createItslearningResponse(person: Person<true>): UserExeternalDataResponseItslearning {
        return new UserExeternalDataResponseItslearning(person.id);
    }

    private static createMergedExternalPkData(
        externalPkData: RequiredExternalPkData[],
        erweiterteSP: ErweiterterServiceProviderForPK[],
    ): RequiredExternalPkData[] {
        return UserExternaldataWorkflowAggregate.mergeServiceProviders(externalPkData, erweiterteSP);
    }

    private static createExternalPkDataWithVidisAngebotId(
        mergedExternalPkData: RequiredExternalPkData[],
    ): RequiredExternalPkData[] {
        return UserExternaldataWorkflowAggregate.getExternalPkDataWithSpWithVidisAngebotId(mergedExternalPkData);
    }

    private static createVidisResponse(
        person: Person<true>,
        externalPkData: RequiredExternalPkData[],
        erweiterteSP: ErweiterterServiceProviderForPK[],
        email?: string,
    ): UserExeternalDataResponseVidis {
        const mergedExternalPkData: RequiredExternalPkData[] = UserExternalDataResponse.createMergedExternalPkData(
            externalPkData,
            erweiterteSP,
        );
        const externalPkDataWithVidisAngebotId: RequiredExternalPkData[] =
            UserExternalDataResponse.createExternalPkDataWithVidisAngebotId(mergedExternalPkData);
        const uniqueDienststellennummern: string[] = uniq(
            externalPkDataWithVidisAngebotId.map((pk: RequiredExternalPkData) => pk.kennung).filter(Boolean),
        );
        const rollenArt: RollenArt | undefined = UserExternaldataWorkflowAggregate.getSingleRollenart(externalPkData);

        return new UserExeternalDataResponseVidis(
            person.id,
            person.vorname,
            person.familienname,
            rollenArt,
            email,
            uniqueDienststellennummern,
        );
    }

    private static createOpshResponse(
        externalPkData: RequiredExternalPkData[],
        person: Person<true>,
        email?: string,
    ): UserExeternalDataResponseOpsh {
        return new UserExeternalDataResponseOpsh(
            person.vorname,
            person.familienname,
            externalPkData.map(
                (pk: RequiredExternalPkData) => new UserExeternalDataResponseOpshPk(pk.rollenart, pk.kennung),
            ),
            email,
        );
    }

    private static createOnlineDateiablageResponse(person: Person<true>): UserExeternalDataResponseOnlineDateiablage {
        return new UserExeternalDataResponseOnlineDateiablage(person.id);
    }

    private static createIqshHelpdeskResponse(
        externalPkData: RequiredExternalPkData[],
        person: Person<true>,
        email?: string,
    ): UserExternalDataResponseIqshHelpdesk {
        return new UserExternalDataResponseIqshHelpdesk(
            person.vorname,
            person.familienname,
            externalPkData.map(
                (pk: RequiredExternalPkData) => new UserExternalDataResponseIqshHelpdeskPk(pk.rolleId, pk.kennung),
            ),
            email,
        );
    }

    private static createPolyteiaResponse(externalPkData: RequiredExternalPkData[]): UserExternalDataResponsePolyteia {
        const rollenArt: RollenArt | undefined = UserExternaldataWorkflowAggregate.getSingleRollenart(externalPkData);
        const dienststellenNummern: string[] =
            UserExternaldataWorkflowAggregate.getUniqDienststellenNummern(externalPkData);

        return new UserExternalDataResponsePolyteia(dienststellenNummern, rollenArt);
    }
}
