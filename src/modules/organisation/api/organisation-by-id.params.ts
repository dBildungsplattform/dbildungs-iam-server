import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class OrganisationByIdParams {
    @IsString()
    @ApiProperty({
        description: 'The id of an organization',
        required: true,
        nullable: false,
    })
    public organisationId!: string;
}
