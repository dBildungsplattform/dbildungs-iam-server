import { ApiProperty } from '@nestjs/swagger';
import { ImportVorgang } from '../domain/import-vorgang.js';
import { Paged } from '../../../shared/paging/paged.js';
import { ImportedUserResponse } from './imported-user.response.js';
import { PagedResponse } from '../../../shared/paging/paged.response.js';

export class ImportResultResponse {
    @ApiProperty()
    public id: string;

    @ApiProperty()
    public rollenname: string;

    @ApiProperty()
    public organisationsname: string;

    @ApiProperty()
    public ImportedUsers: Paged<ImportedUserResponse>;

    public constructor(importVorgang: ImportVorgang<true>) {
        this.id = importVorgang.id;
        this.rollenname = importVorgang.rollename;
        this.organisationsname = importVorgang.organisationsname;

        const pagedImportedUsersResponse: Paged<ImportedUserResponse> = {
            total: 0,
            offset: 0,
            limit: 0,
            items: [],
        };

        this.ImportedUsers = new PagedResponse(pagedImportedUsersResponse);
    }
}
