import { ApiProperty } from '@nestjs/swagger';
import { UserExeternalDataResponseIqshHelpdeskPk } from './user-externaldata-iqshhelpdesk-pk.response.js';

export class UserExternalDataResponseIqshHelpdesk {
    @ApiProperty()
    public vorname: string;

    @ApiProperty()
    public nachname: string;

    @ApiProperty({ type: [UserExeternalDataResponseIqshHelpdeskPk] })
    public personenkontexte: UserExeternalDataResponseIqshHelpdeskPk[];

    @ApiProperty()
    public emailAdresse?: string;

    public constructor(
        vorname: string,
        nachname: string,
        personenkontexte: UserExeternalDataResponseIqshHelpdeskPk[],
        emailAdresse?: string,
    ) {
        this.vorname = vorname;
        this.nachname = nachname;
        this.personenkontexte = personenkontexte;
        this.emailAdresse = emailAdresse;
    }
}
