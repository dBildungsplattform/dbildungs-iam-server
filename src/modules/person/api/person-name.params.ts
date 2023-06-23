import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class PersonNameParams {
    @AutoMap()
    @IsString()
    @Expose({ name: 'familienname' })
    @ApiProperty({ name: 'familienname' })
    public readonly lastName!: string;

    @AutoMap()
    @IsString()
    @Expose({ name: 'vorname' })
    @ApiProperty({ name: 'vorname' })
    public readonly firstName!: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @Expose({ name: 'initialenfamilienname' })
    @ApiProperty({ name: 'initialenfamilienname', required: false })
    public readonly initialsLastName?: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @Expose({ name: 'initialenvorname' })
    @ApiProperty({ name: 'initialenvorname', required: false })
    public readonly initialsFirstName?: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @Expose({ name: 'rufname' })
    @ApiProperty({ name: 'rufname', required: false })
    public readonly nickName?: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @Expose({ name: 'titel' })
    @ApiProperty({ name: 'titel', required: false })
    public readonly title?: string;

    @AutoMap()
    @IsOptional()
    @IsArray()
    @Expose({ name: 'anrede' })
    @ApiProperty({ name: 'anrede', required: false })
    public readonly salutation?: string[];

    @AutoMap()
    @IsOptional()
    @IsArray()
    @Expose({ name: 'namenssuffix' })
    @ApiProperty({ name: 'namenssuffix', required: false })
    public readonly suffix?: string[];

    @AutoMap()
    @IsOptional()
    @IsString()
    @Expose({ name: 'sortierindex' })
    @ApiProperty({ name: 'sortierindex', required: false })
    public readonly sortIndex?: string;
}
