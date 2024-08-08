import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class TokenVerifyBodyParams {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ type: String })
    public readonly personId!: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ type: String })
    public readonly otp!: string;
}
