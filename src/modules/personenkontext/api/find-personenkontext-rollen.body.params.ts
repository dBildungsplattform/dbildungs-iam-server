import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindPersonenkontextRollenBodyParams {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: 'Rolle name used to filter for rollen in personenkontext.',
        required: true,
        nullable: false,
    })
    public readonly rolleName!: string;

    @IsNotEmpty()
    @IsNumber()
    @ApiProperty({
        description: 'The limit of items for the request.',
        required: true,
        nullable: false,
    })
    public readonly limit!: number;
}
