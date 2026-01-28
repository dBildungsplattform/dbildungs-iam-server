import { PagedQueryParams } from '../../../shared/paging/index.js';
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ManageableServiceProvidersForOrganisationParams extends PagedQueryParams {
    @IsUUID()
    @ApiProperty({
        description: 'The id of the organisation',
        required: true,
        nullable: false,
    })
    public readonly organisationId!: string;
}
