import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignHardwareTokenBodyParams {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({ required: true })
    public serial!: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({ required: true })
    public otp!: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({ required: true })
    public username!: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({ required: true })
    public userId!: string;
}
