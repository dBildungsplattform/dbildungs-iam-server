import { ApiProperty } from '@nestjs/swagger';
import { ImportDataItem } from '../domain/import-data-item.js';

export class ImportedUserResponse {
    @ApiProperty()
    public klasse: string;

    @ApiProperty()
    public vorname: string;

    @ApiProperty()
    public nachname: string;

    @ApiProperty()
    public benutzername: string;

    @ApiProperty({ description: 'Initiales Benutzerpasswort, muss nach der ersten Anmeldung geändert werden' })
    public startpasswort: string;

    public constructor(importedDataItem: ImportDataItem<true>) {
        this.klasse = importedDataItem.klasse!;
        this.vorname = importedDataItem.vorname;
        this.nachname = importedDataItem.nachname;
        this.benutzername = importedDataItem.username!;
        this.startpasswort = importedDataItem.password!;
    }
}
