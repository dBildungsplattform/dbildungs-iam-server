import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindDbiamPersonenkontextWorkflowBodyParams {
    @IsUUID()
    @IsOptional()
    @ApiProperty({
        description: 'ID of the organisation to filter the rollen later',
        required: false,
        nullable: true,
    })
    public readonly organisationId?: string;

    @IsUUID()
    @IsOptional()
    @ApiProperty({
        description: 'ID of the rolle.',
        required: false,
        nullable: true,
    })
    public readonly rolleId?: string;
}