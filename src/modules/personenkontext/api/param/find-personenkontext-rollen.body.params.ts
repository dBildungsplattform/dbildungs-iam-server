import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindPersonenkontextRollenBodyParams {
    @IsString()
    @ApiProperty({
        description: 'Rolle name used to filter for rollen in personenkontext.',
        required: true,
        nullable: false,
    })
    public readonly rolleName!: string;

    @IsNotEmpty()
    @IsNumber()
    @IsOptional()
    @ApiProperty({
        description: 'The limit of items for the request.',
        required: false,
        nullable: false,
    })
    public readonly limit?: number;
}
