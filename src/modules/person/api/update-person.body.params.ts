import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { PersonNameParams } from './person-name.params.js';

export class UpdatePersonBodyParams {
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly username?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly stammorganisation?: string;

    @ValidateNested()
    @Type(() => PersonNameParams)
    @ApiProperty({ type: PersonNameParams, required: true })
    public readonly name!: PersonNameParams;

    @IsString()
    @ApiProperty({ required: true })
    public readonly revision!: string;
}
