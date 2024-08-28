import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ProvidersForPersonParams {
    @IsUUID()
    @ApiProperty({
        description: 'The id of a person',
        required: true,
        nullable: false,
    })
    public personId!: string;
}
