import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class LockUserDto {
    @IsBoolean()
    @ApiProperty({
        required: true,
        nullable: false,
    })
    public readonly lock!: boolean;
}
