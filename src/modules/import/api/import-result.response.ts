import { ApiProperty } from '@nestjs/swagger';
import { Paged } from '../../../shared/paging/paged.js';
import { ImportedUserResponse } from './imported-user.response.js';
import { PagedResponse } from '../../../shared/paging/paged.response.js';
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
        type: ImportedUserResponse, 
        isArray: true,
    })
    public importedUsers: Paged<ImportedUserResponse>; 

    public constructor(importResult: ImportResult, offset?: number, limit?: number) {
        this.importvorgandId = importResult.importvorgang.id;
        this.rollenname = importResult.importvorgang.rollename;
        this.organisationsname = importResult.importvorgang.organisationsname;

        const pagedImportedUsersResponse: Paged<ImportedUserResponse> = {
            total: importResult.count,
            pageTotal: importResult.importedDataItems.length,
            offset: offset ?? 0,
            limit: limit ?? importResult.importedDataItems.length,
            items: importResult.importedDataItems.map(
                (importedDataItem: ImportDataItem<true>) => new ImportedUserResponse(importedDataItem),
            ),
        };

        this.importedUsers = new PagedResponse(pagedImportedUsersResponse);
    }
}
