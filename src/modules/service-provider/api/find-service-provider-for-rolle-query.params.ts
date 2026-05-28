import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FindServiceProviderForRolleQueryParams {
    @IsUUID()
    @ApiProperty({
        description: 'The id of the organisation where the service provider should be assignable on',
        required: true,
        nullable: false,
    })
    public schulstrukturknotenOfRolle!: string;
}
