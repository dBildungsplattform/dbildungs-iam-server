import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PersonBirthParams } from './person-birth.params.js';
import { PersonNameParams } from './person-name.params.js';
import { Geschlecht, Vertrauensstufe } from '../domain/person.enums.js';

export class CreatePersonBodyParams {
    @IsOptional()
    @IsEmail()
    @ApiProperty({ required: false })
    public readonly email?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly referrer?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly stammorganisation?: string;

    @ValidateNested()
    @Type(() => PersonNameParams)
    @ApiProperty({ type: PersonNameParams, required: true })
    public readonly name!: PersonNameParams;

    @IsOptional()
    @ValidateNested()
    @Type(() => PersonBirthParams)
    @ApiProperty({ type: PersonBirthParams, required: false })
    public readonly geburt?: PersonBirthParams;

    @IsOptional()
    @IsString()
    @IsEnum(Geschlecht)
    @ApiProperty({ enum: Geschlecht, required: false })
    public readonly geschlecht?: Geschlecht;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly lokalisierung?: string;

    @IsOptional()
    @IsString()
    @IsEnum(Vertrauensstufe)
    @ApiProperty({ enum: Vertrauensstufe, required: false })
    public readonly vertrauensstufe?: Vertrauensstufe;

    @IsOptional()
    @IsBoolean()
    @ApiProperty({ required: false })
    public readonly auskunftssperre?: boolean;
}
