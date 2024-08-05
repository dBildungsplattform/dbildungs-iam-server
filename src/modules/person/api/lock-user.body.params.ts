import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class LockUserBodyParams {
    @IsBoolean()
    @ApiProperty({
        required: true,
        nullable: false,
    })
    public readonly lock!: boolean;

    @IsString()
    @ApiProperty({
        required: true,
        nullable: false,
    })
    public readonly locked_from!: string;
}
