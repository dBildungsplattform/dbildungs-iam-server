import { ApiProperty } from '@nestjs/swagger';
import { Paged } from '../../../shared/paging/paged.js';
import { ImportedUserResponse } from './imported-user.response.js';
import { PagedResponse } from '../../../shared/paging/paged.response.js';
import { ImportResult } from '../domain/import-workflow.js';
import { ImportDataItem } from '../domain/import-data-item.js';

export class ImportResultResponse {
    @ApiProperty()
    public id: string;

    @ApiProperty()
    public rollenname: string;

    @ApiProperty()
    public organisationsname: string;

    @ApiProperty()
    public ImportedUsers: Paged<ImportedUserResponse>;

    public constructor(importResult: ImportResult, offset?: number, limit?: number) {
        this.id = importResult.importvorgang.id;
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

        this.ImportedUsers = new PagedResponse(pagedImportedUsersResponse);
    }
}
