import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class FindServiceProviderQueryParams {
    @IsUUID()
    @IsOptional()
    @ApiProperty({
        description: 'The id of the organisation where the service provider should be assignable on',
        required: false,
        nullable: true,
    })
    public organisationId?: string;
}
