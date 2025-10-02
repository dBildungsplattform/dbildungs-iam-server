import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FindPersonenkontextByIdParams {
    @IsUUID()
    @ApiProperty({
        description: 'The id for the personenkontext.',
        required: true,
        nullable: false,
    })
    public readonly personenkontextId!: string;
}
