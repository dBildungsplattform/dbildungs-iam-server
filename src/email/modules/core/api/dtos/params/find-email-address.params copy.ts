import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class FindEmailAddressParams {
    @IsString()
    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({
        description: 'The emailAddress to find.',
        required: true,
        nullable: false,
    })
    public readonly emailAddress!: string;
}
