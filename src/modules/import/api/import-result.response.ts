import { ApiProperty } from '@nestjs/swagger';
import { ImportedUserResponse } from './imported-user.response.js';
import { ImportResult } from '../domain/import-workflow.js';
import { ImportDataItem } from '../domain/import-data-item.js';

export class ImportResultResponse {
    @ApiProperty()
    public importvorgandId: string;

    @ApiProperty()
    public rollenname: string;

    @ApiProperty()
    public organisationsname: string;

    @ApiProperty({
        type: [ImportedUserResponse],
    })
    public importedUsers: ImportedUserResponse[];

    @ApiProperty({ description: 'Total number of imported users' })
    public total: number;

    @ApiProperty({ description: 'Number of users on this page' })
    public pageTotal: number;

    public constructor(importResult: ImportResult) {
        this.importvorgandId = importResult.importvorgang.id;
        this.rollenname = importResult.importvorgang.rollename;
        this.organisationsname = importResult.importvorgang.organisationsname;

        this.importedUsers = importResult.importedDataItems.map(
            (importedDataItem: ImportDataItem<true>) => new ImportedUserResponse(importedDataItem),
        );

        this.total = importResult.count;
        this.pageTotal = importResult.importedDataItems.length;
    }
}
