import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { RollenSystemRechtEnum, RollenSystemRechtTypName } from '../domain/rolle.enums.js';

export class AddSystemrechtBodyParams {
    @IsEnum(RollenSystemRechtEnum)
    @IsNotEmpty()
    @ApiProperty({ enum: RollenSystemRechtEnum, enumName: RollenSystemRechtTypName, required: true })
    public readonly systemRecht!: RollenSystemRechtEnum;
}
