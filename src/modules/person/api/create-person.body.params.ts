import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PersonGender, PersonTrustLevel } from '../domain/person.enums.js';
import { PersonBirthParams } from './person-birth.params.js';
import { PersonNameParams } from '../dto/person-name.params.js';

export class CreatePersonBodyParams {
    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly referrer?: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @Expose({ name: 'mandant' })
    @ApiProperty({ name: 'mandant', required: false })
    public readonly client?: string;

    @AutoMap(() => PersonNameParams)
    @ValidateNested()
    @Type(() => PersonNameParams)
    @ApiProperty({ type: PersonNameParams })
    public readonly name!: PersonNameParams;

    @AutoMap(() => PersonBirthParams)
    @ValidateNested()
    @Expose({ name: 'geburt' })
    @Type(() => PersonBirthParams)
    @ApiProperty({ name: 'geburt' })
    public readonly birth!: PersonBirthParams;

    @AutoMap()
    @IsOptional()
    @IsString()
    @IsEnum(PersonGender)
    @Expose({ name: 'geschlecht' })
    @ApiProperty({ name: 'geschlecht', enum: PersonGender, required: false })
    public readonly gender?: PersonGender;

    @AutoMap()
    @IsOptional()
    @IsString()
    @Expose({ name: 'lokalisierung' })
    @ApiProperty({ name: 'lokalisierung', default: 'de-DE', required: false })
    public readonly localization?: string = 'de-DE';

    @AutoMap()
    @IsOptional()
    @IsString()
    @IsEnum(PersonTrustLevel)
    @Expose({ name: 'vertrauensstufe' })
    @ApiProperty({ name: 'vertrauensstufe', enum: PersonTrustLevel, required: false })
    public readonly trustLevel?: PersonTrustLevel;

    @AutoMap()
    @IsOptional()
    @IsBoolean()
    @Expose({ name: 'auskunftssperre' })
    @ApiProperty({ name: 'auskunftssperre', required: false })
    public readonly isEnabled?: boolean;
}
