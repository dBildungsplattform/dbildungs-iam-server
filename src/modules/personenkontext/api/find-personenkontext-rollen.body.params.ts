import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindPersonenkontextRollenBodyParams {
    @IsNotEmpty()
    @IsUUID()
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
