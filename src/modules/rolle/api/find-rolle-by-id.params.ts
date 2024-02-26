import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class FindRolleByIdParams {
    @IsNotEmpty()
    @ApiProperty({
        description: 'The id for the rolle.',
        required: true,
        nullable: false,
    })
    public readonly rolleId!: string;
}
