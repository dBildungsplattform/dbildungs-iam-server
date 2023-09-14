import { AutoMap } from '@automapper/classes';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

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
    @IsString()
    @IsNotEmpty()
    public email!: string;

    @AutoMap()
    @IsString()
    @IsNotEmpty()
    public firstName!: string;

    @AutoMap()
    @IsString()
    @IsNotEmpty()
    public lastName!: string;

    @AutoMap()
    @IsNumber()
    public createdTimestamp!: number;
}
