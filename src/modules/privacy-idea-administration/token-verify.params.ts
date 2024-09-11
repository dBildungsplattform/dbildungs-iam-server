import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class TokenVerifyBodyParams {
    @IsUUID()
    @ApiProperty({ type: String })
    public readonly personId!: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ type: String })
    public readonly otp!: string;
}
