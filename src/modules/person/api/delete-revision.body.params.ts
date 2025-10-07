import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DeleteRevisionBodyParams {
    @IsString()
    @ApiProperty({
        description: 'The revision of a personenkontext.',
        required: true,
        nullable: false,
    })
    public readonly revision!: string;
}
