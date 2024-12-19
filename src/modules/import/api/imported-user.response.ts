import { ApiProperty } from '@nestjs/swagger';

export class ImportedUserResponse {
    @ApiProperty()
    public Klasse: string;

    @ApiProperty()
    public Vorname: string;

    @ApiProperty()
    public Nachname: string;

    @ApiProperty()
    public Benutzername: string;

    @ApiProperty({ description: 'Initiales Benutzerpasswort, muss nach der ersten Anmeldung geändert werden' })
    public startpasswort: string;

    public constructor() {
        this.Klasse = 'Klasse';
        this.Vorname = 'Vorname';
        this.Nachname = 'Nachname';
        this.Benutzername = 'Benutzername';
        this.startpasswort = 'startpasswort';
    }
}
