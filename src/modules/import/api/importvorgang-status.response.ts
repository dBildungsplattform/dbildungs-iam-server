import { ApiProperty } from '@nestjs/swagger';
import { ImportStatus, ImportStatusName } from '../domain/import.enums.js';
import { ImportVorgang } from '../domain/import-vorgang.js';

export class ImportVorgangStatusResponse {
    @ApiProperty({ enum: ImportStatus, enumName: ImportStatusName })
    public status: ImportStatus;

    public constructor(importVorgang: ImportVorgang<true>) {
        this.status = importVorgang.status;
    }
}
