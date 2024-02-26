import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { RollenSystemRecht } from '../../rolle/domain/rolle.enums.js';

export class HatSystemrechtBodyParams {
    @IsEnum(RollenSystemRecht)
    @IsNotEmpty()
    @ApiProperty({ enum: RollenSystemRecht, required: true })
    public readonly systemRecht!: RollenSystemRecht;
}
