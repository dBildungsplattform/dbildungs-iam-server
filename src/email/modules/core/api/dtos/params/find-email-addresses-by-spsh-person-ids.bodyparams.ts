import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

export class FindEmailAddressBySpshPersonIdsBodyParams {
    @IsArray()
    @ArrayMaxSize(2500)
    @IsUUID(undefined, { each: true })
    @ApiProperty({
        description: 'The spshPersonIds for the emailAddresses.',
        required: true,
        nullable: false,
    })
    public readonly spshPersonIds!: string[];
}
