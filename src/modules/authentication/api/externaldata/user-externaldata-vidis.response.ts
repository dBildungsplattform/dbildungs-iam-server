import { ApiProperty } from '@nestjs/swagger';
import { RollenArt } from '../../../rolle/domain/rolle.enums.js';

export class UserExeternalDataResponseVidis {
    @ApiProperty()
    public personId: string;

    @ApiProperty()
    public vorname: string;

    @ApiProperty()
    public nachname: string;

    @ApiProperty()
    public rollenart?: RollenArt;

    @ApiProperty()
    public emailAdresse?: string;

    @ApiProperty({ type: [String] })
    public dienststellenNummern: string[];

    public constructor(
        personId: string,
        vorname: string,
        nachname: string,
        rollenart: RollenArt | undefined,
        emailAdresse: string | undefined,
        dienststellenNummern: string[],
    ) {
        this.personId = personId;
        this.vorname = vorname;
        this.nachname = nachname;
        this.rollenart = rollenart;
        this.emailAdresse = emailAdresse;
        this.dienststellenNummern = dienststellenNummern;
    }
}
