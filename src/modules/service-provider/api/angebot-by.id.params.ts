import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AngebotByIdParams {
    @IsString()
    @ApiProperty({
        description: 'The id of the service provider',
        required: true,
        nullable: false,
    })
    public angebotId!: string;
}
