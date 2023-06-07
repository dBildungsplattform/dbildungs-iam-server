import { IsArray, IsOptional, IsString } from 'class-validator';

export class PersonNameParams {
    @IsString()
    public readonly familienname!: string;

    @IsString()
    public readonly vorname!: string;

    @IsOptional()
    @IsString()
    public readonly initialenFamilienname?: string;

    @IsOptional()
    @IsString()
    public readonly rufname?: string;

    @IsOptional()
    @IsString()
    public readonly title?: string;

    @IsOptional()
    @IsArray()
    public readonly anrede?: string[];

    @IsOptional()
    @IsArray()
    public readonly namenssuffix?: string[];

    @IsOptional()
    @IsString()
    public readonly sortierindex?: string;
}
