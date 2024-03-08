import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PersonByIdParams {
    @IsUUID()
    @ApiProperty({
        description: 'The id for the account.',
        required: true,
        nullable: false,
    })
    public personId!: string;
}
