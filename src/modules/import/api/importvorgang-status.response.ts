import { ApiProperty } from '@nestjs/swagger';
import { ImportStatus, ImportStatusName } from '../domain/import.enums.js';
import { ImportVorgang } from '../domain/import-vorgang.js';

export class ImportVorgangStatusResponse {
    @ApiProperty()
    public dataItemCount: number;

    @ApiProperty({ enum: ImportStatus, enumName: ImportStatusName })
    public status: ImportStatus;

    @ApiProperty()
    public totalDataItemImported: number;

    public constructor(importVorgang: ImportVorgang<true>) {
        this.dataItemCount = importVorgang.dataItemCount;
        this.status = importVorgang.status;
        this.totalDataItemImported = importVorgang.totalDataItemImported;
    }
}
