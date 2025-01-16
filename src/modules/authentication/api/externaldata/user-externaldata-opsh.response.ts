import { ApiProperty } from '@nestjs/swagger';
import { UserExeternalDataResponseOpshPk } from './user-externaldata-opsh-pk.response.js';

export class UserExeternalDataResponseOpsh {
    @ApiProperty()
    public vorname: string;

    @ApiProperty()
    public nachname: string;

    @ApiProperty({ type: [UserExeternalDataResponseOpshPk] })
    public personenkontexte: UserExeternalDataResponseOpshPk[];

    @ApiProperty()
    public emailAdresse?: string;

    public constructor(
        vorname: string,
        nachname: string,
        personenkontexte: UserExeternalDataResponseOpshPk[],
        emailAdresse?: string,
    ) {
        this.vorname = vorname;
        this.nachname = nachname;
        this.personenkontexte = personenkontexte;
        this.emailAdresse = emailAdresse;
    }
}
