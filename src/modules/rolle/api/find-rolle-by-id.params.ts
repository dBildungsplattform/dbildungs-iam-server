import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FindRolleByIdParams {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'The id for the rolle.',
        required: true,
        nullable: false,
    })
    public readonly rolleId!: string;
}
