import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class TokenInitBodyParams {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ type: String })
    public readonly personId!: string;
}
