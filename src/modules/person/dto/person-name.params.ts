import { AutoMap } from '@automapper/classes';
import { Expose } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class PersonNameParams {
    @AutoMap()
    @IsString()
    @Expose({ name: 'familienname' })
    public readonly lastName!: string;

    @AutoMap()
    @IsString()
    @Expose({ name: 'vorname' })
    public readonly firstName!: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @Expose({ name: 'initialenfamilienname' })
    public readonly initialsLastName?: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @Expose({ name: 'initialenvorname' })
    public readonly initialsFirstName?: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @Expose({ name: 'rufname' })
    public readonly nickName?: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @Expose({ name: 'titel' })
    public readonly title?: string;

    @AutoMap()
    @IsOptional()
    @IsArray()
    @Expose({ name: 'anrede' })
    public readonly salutation?: string[];

    @AutoMap()
    @IsOptional()
    @IsArray()
    @Expose({ name: 'namenssuffix' })
    public readonly suffix?: string[];

    @AutoMap()
    @IsOptional()
    @IsString()
    @Expose({ name: 'sortierindex' })
    public readonly sortIndex?: string;
}
