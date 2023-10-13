import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ServiceProviderByPersonIdBodyParams {
    @IsString()
    @ApiProperty({
        description: 'The id of the person to find available service providers for.',
        required: true,
        nullable: false,
    })
    public personId!: string;
}
