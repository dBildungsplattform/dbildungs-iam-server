import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindPersonenkontextSchulstrukturknotenBodyParams {
    @IsNotEmpty()
    @IsUUID()
    @ApiProperty({
        description: 'RolleId used to filter for schulstrukturknoten in personenkontext.',
        required: true,
        nullable: false,
    })
    public readonly rolleId!: string;

    @IsNotEmpty()
    @IsUUID()
    @ApiProperty({
        description: 'Organisation/SSK name used to filter for schulstrukturknoten in personenkontext.',
        required: true,
        nullable: false,
    })
    public readonly sskName!: string;

    @IsNotEmpty()
    @IsNumber()
    @ApiProperty({
        description: 'The limit of items for the request.',
        required: true,
        nullable: false,
    })
    public readonly limit!: number;
}
