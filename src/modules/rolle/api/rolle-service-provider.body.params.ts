import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class RolleServiceProviderBodyParams {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    @ApiProperty({
        description: 'The id for the service provider.',
        required: true,
        nullable: false,
    })
    public readonly serviceProviderId!: string;

    @IsNumber()
    @ApiProperty({ description: 'The version for the rolle.', required: true })
    public readonly version!: number;
}
