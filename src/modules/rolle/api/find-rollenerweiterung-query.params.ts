import { IsOptional, IsUUID } from 'class-validator';
import { OrganisationID } from '../../../shared/types/index.js';
import { ApiProperty } from '@nestjs/swagger';

export class FindRollenerweiterungQueryParams {
    @IsUUID()
    @IsOptional()
    @ApiProperty({
        description: 'The id of the organisation where the role should be available.',
        required: false,
    })
    public readonly organisationId?: OrganisationID;
}
