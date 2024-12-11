import { ApiProperty } from '@nestjs/swagger';
import { ImportStatus, ImportStatusName } from '../domain/import.enums.js';
import { ImportVorgang } from '../domain/import-vorgang.js';

export class ImportVorgangResponse {
    @ApiProperty()
    public id: string;

    @ApiProperty()
    public createdAt: Date;

    @ApiProperty()
    public updatedAt: Date;

    @ApiProperty()
    public rollenname: string;

    @ApiProperty()
    public organisationsname: string;

    @ApiProperty()
    public dataItemCount: number;

    @ApiProperty({ enum: ImportStatus, enumName: ImportStatusName })
    public status: ImportStatus;

    public constructor(importVorgang: ImportVorgang<true>) {
        this.id = importVorgang.id;
        this.createdAt = importVorgang.createdAt;
        this.updatedAt = importVorgang.updatedAt;
        this.rollenname = importVorgang.rollename;
        this.organisationsname = importVorgang.organisationsname;
        this.dataItemCount = importVorgang.dataItemCount;
        this.status = importVorgang.status;
    }
}
