import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Geschlecht, GeschlechtTypName, Vertrauensstufe, VertrauensstufeTypName } from '../domain/person.enums.js';
import { PersonBirthParams } from './person-birth.params.js';
import { PersonNameParams } from './person-name.params.js';

export class UpdatePersonBodyParams {
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
    @ApiProperty({ enum: Geschlecht, enumName: GeschlechtTypName, required: false })
    public readonly geschlecht?: Geschlecht;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly lokalisierung?: string;

    @IsOptional()
    @IsString()
    @IsEnum(Vertrauensstufe)
    @ApiProperty({ enum: Vertrauensstufe, enumName: VertrauensstufeTypName, required: false })
    public readonly vertrauensstufe?: Vertrauensstufe;

    @IsOptional()
    @IsBoolean()
    @ApiProperty({ required: false })
    public readonly auskunftssperre?: boolean;

    @IsString()
    @ApiProperty({ required: true })
    public readonly revision!: string;
}
