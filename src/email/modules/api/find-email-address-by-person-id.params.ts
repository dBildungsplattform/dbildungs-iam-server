import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class FindEmailAddressByPersonIdParams {
    @IsString()
    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({
        description: 'The personId for the emailAddress.',
        required: true,
        nullable: false,
    })
    public readonly personId!: string;
}
