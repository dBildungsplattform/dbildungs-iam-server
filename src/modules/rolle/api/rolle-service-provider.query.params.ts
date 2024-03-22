import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class RolleServiceProviderQueryParams {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    @ApiProperty({
        description: 'The id for the rolle.',
        required: true,
        nullable: false,
    })
    public readonly serviceProviderId!: string;
}
