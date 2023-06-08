import { AutoMap } from '@automapper/classes';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class PersonNameParams {
    @AutoMap()
    @IsString()
    public readonly familienname!: string;

    @AutoMap()
    @IsString()
    public readonly vorname!: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    public readonly initialenFamilienname?: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    public readonly rufname?: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    public readonly title?: string;

    @AutoMap()
    @IsOptional()
    @IsArray()
    public readonly anrede?: string[];

    @AutoMap()
    @IsOptional()
    @IsArray()
    public readonly namenssuffix?: string[];

    @AutoMap()
    @IsOptional()
    @IsString()
    public readonly sortierindex?: string;
}
