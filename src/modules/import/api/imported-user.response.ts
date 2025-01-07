import { ApiProperty } from '@nestjs/swagger';
import { ImportDataItem } from '../domain/import-data-item.js';
import { ImportDataItemStatus } from '../domain/importDataItem.enum.js';

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

    @ApiProperty({ enum: ImportDataItemStatus, enumName: 'ImportDataItemStatus' })
    public status: ImportDataItemStatus;

    public constructor(importedDataItem: ImportDataItem<true>) {
        this.klasse = importedDataItem.klasse!;
        this.vorname = importedDataItem.vorname;
        this.nachname = importedDataItem.nachname;
        this.benutzername = importedDataItem.username!;
        this.startpasswort = importedDataItem.password!;
        this.status = importedDataItem.status!;
    }
}
