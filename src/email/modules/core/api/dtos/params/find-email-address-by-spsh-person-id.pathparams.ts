import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class FindEmailAddressBySpshPersonIdPathParams {
    @IsString()
    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({
        description: 'The spshPersonId for the emailAddress.',
        required: true,
        nullable: false,
    })
    public readonly spshPersonId!: string;
}
