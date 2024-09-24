import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsNotEmpty, IsString } from 'class-validator';

export class LockUserBodyParams {
    @IsBoolean()
    @ApiProperty({
        required: true,
        nullable: false,
    })
    public readonly lock!: boolean;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        required: true,
        nullable: false,
    })
    public readonly locked_from!: string;

    @IsDate()
    @ApiProperty({
        required: true,
        nullable: true,
    })
    public readonly locked_until!: Date;
}
