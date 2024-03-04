import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AngebotByIdParams {
    @IsUUID()
    @ApiProperty({
        description: 'The id of the service provider',
        required: true,
        nullable: false,
    })
    public angebotId!: string;
}
