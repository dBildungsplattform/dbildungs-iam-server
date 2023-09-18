import { AutoMap } from '@automapper/classes';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserRepresentationDto {
    @AutoMap()
    @IsString()
    @IsNotEmpty()
    public username!: string;

    @AutoMap()
    @IsOptional()
    @IsEmail()
    public email?: string;
}
