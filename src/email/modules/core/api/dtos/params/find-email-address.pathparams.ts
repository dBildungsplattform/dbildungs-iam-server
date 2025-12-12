import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FindEmailAddressPathParams {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'The emailAddress to find.',
        required: true,
        nullable: false,
    })
    public readonly emailAddress!: string;
}
