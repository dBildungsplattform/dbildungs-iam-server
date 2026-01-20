import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { RollenSystemRechtEnum, RollenSystemRechtEnumName } from '../domain/systemrecht.js';

export class AddSystemrechtBodyParams {
    @IsEnum(RollenSystemRechtEnum)
    @IsNotEmpty()
    @ApiProperty({ enum: RollenSystemRechtEnum, enumName: RollenSystemRechtEnumName, required: true })
    public readonly systemRecht!: RollenSystemRechtEnum;
}
