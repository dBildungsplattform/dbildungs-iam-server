import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class FindRolleByIdParams {
    @IsString()
    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({
        description: 'The id for the rolle.',
        required: true,
        nullable: false,
    })
    public readonly rolleId!: string;
}
