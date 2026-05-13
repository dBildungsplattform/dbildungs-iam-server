import { ApiProperty } from '@nestjs/swagger';
import { UserExternalDataResponseIqshHelpdeskPk } from './user-externaldata-iqshhelpdesk-pk.response.js';

export class UserExternalDataResponseIqshHelpdesk {
    @ApiProperty()
    public vorname: string;

    @ApiProperty()
    public nachname: string;

    @ApiProperty({ type: [UserExternalDataResponseIqshHelpdeskPk] })
    public personenkontexte: UserExternalDataResponseIqshHelpdeskPk[];

    @ApiProperty()
    public emailAdresse?: string;

    public constructor(
        vorname: string,
        nachname: string,
        personenkontexte: UserExternalDataResponseIqshHelpdeskPk[],
        emailAdresse?: string,
    ) {
        this.vorname = vorname;
        this.nachname = nachname;
        this.personenkontexte = personenkontexte;
        this.emailAdresse = emailAdresse;
    }
}
