import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class FindEmailAddressBySpshPersonIdsBodyParams {
    @IsArray()
    @ArrayMinSize(2500)
    @IsString({ each: true })
    @IsUUID(undefined, { each: true })
    @IsNotEmpty()
    @ApiProperty({
        description: 'The spshPersonIds for the emailAddresses.',
        required: true,
        nullable: false,
    })
    public readonly spshPersonIds!: string[];
}
