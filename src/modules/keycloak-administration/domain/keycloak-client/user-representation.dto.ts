import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import { UserRepresentationAttributesDto } from './user-representation-attributes.dto.js';

export class UserRepresentationDto {
    @IsString()
    @IsNotEmpty()
    public id!: string;

    @IsString()
    @IsNotEmpty()
    public username!: string;

    @IsOptional()
    @IsEmail()
    public email?: string;

    @IsNumber()
    public createdTimestamp!: number;

    @ValidateNested()
    @Type(() => UserRepresentationAttributesDto)
    public attributes!: UserRepresentationAttributesDto;
}
