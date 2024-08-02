import { AutoMap } from '@automapper/classes';
import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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

    @IsBoolean()
    public enabled!: boolean;

    public attributes!: Record<string, string>;
}
