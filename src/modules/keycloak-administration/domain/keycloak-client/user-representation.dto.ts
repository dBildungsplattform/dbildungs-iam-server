import { AutoMap } from '@automapper/classes';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UserRepresentationDto {
    @AutoMap()
    @IsString()
    @IsNotEmpty()
    public id!: string;

    @AutoMap()
    @IsString()
    @IsNotEmpty()
    public username!: string;

    @AutoMap()
    @IsOptional()
    @IsEmail()
    public email?: string;

    @AutoMap()
    @IsNumber()
    public createdTimestamp!: number;
}
