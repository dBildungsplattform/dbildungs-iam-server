import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { PersonBirthParams } from './person-birth.params.js';
import { PersonNameParams } from './person-name.params.js';
import { PersonGender, PersonTrustLevel } from './person.enums.js';

export class CreatePersonBodyParams {
    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly referrer?: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @IsUUID()
    @Expose({ name: 'mandant' })
    @ApiProperty({ name: 'mandant', required: true })
    public readonly mandant!: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @Expose({ name: 'stammorganisation' })
    @ApiProperty({ name: 'stammorganisation', required: false })
    public readonly stammorganisation?: string;

    @AutoMap(() => PersonNameParams)
    @ValidateNested()
    @Type(() => PersonNameParams)
    @ApiProperty({ type: PersonNameParams, required: true })
    public readonly name!: PersonNameParams;

    @AutoMap(() => PersonBirthParams)
    @ValidateNested()
    @Expose({ name: 'geburt' })
    @Type(() => PersonBirthParams)
    @ApiProperty({ name: 'geburt', required: true })
    public readonly geburt!: PersonBirthParams;

    @AutoMap()
    @IsOptional()
    @IsString()
    @IsEnum(PersonGender)
    @Expose({ name: 'geschlecht' })
    @ApiProperty({ name: 'geschlecht', enum: PersonGender, required: false })
    public readonly geschlecht?: PersonGender;

    @AutoMap()
    @IsOptional()
    @IsString()
    @Expose({ name: 'lokalisierung' })
    @ApiProperty({ name: 'lokalisierung', default: 'de-DE', required: false })
    public readonly lokalisierung?: string = 'de-DE';

    @AutoMap()
    @IsOptional()
    @IsString()
    @IsEnum(PersonTrustLevel)
    @Expose({ name: 'vertrauensstufe' })
    @ApiProperty({ name: 'vertrauensstufe', enum: PersonTrustLevel, required: false })
    public readonly vertrauensstufe?: PersonTrustLevel;

    @AutoMap()
    @IsOptional()
    @IsBoolean()
    @Expose({ name: 'auskunftssperre' })
    @ApiProperty({ name: 'auskunftssperre', required: false })
    public readonly sichtfreigabe?: boolean;
}
