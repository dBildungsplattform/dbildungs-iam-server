import { AutoMap } from '@automapper/classes';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PersonGender, PersonTrustLevel } from '../person.enums.js';
import { PersonBirthParams } from './person-birth.params.js';
import { PersonNameParams } from './person-name.params.js';

export class CreatePersonBodyParams {
    @AutoMap()
    @IsOptional()
    @IsString()
    public readonly referrer?: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @Expose({ name: 'mandant' })
    public readonly client?: string;

    @AutoMap(() => PersonNameParams)
    @ValidateNested()
    @Type(() => PersonNameParams)
    public readonly name!: PersonNameParams;

    @AutoMap(() => PersonBirthParams)
    @ValidateNested()
    @Expose({ name: 'geburt' })
    @Type(() => PersonBirthParams)
    public readonly birth!: PersonBirthParams;

    @AutoMap()
    @IsOptional()
    @IsString()
    @IsEnum(PersonGender)
    @Expose({ name: 'geschlecht' })
    public readonly gender?: PersonGender;

    @AutoMap()
    @IsOptional()
    @IsString()
    @Expose({ name: 'lokalisierung' })
    public readonly localization?: string = 'de-DE';

    @AutoMap()
    @IsOptional()
    @IsString()
    @IsEnum(PersonTrustLevel)
    @Expose({ name: 'vertrauensstufe' })
    public readonly trustLevel?: PersonTrustLevel;

    @AutoMap()
    @IsOptional()
    @IsBoolean()
    @Expose({ name: 'auskunftssperre' })
    // TODO: rename this prop
    public readonly isActive?: boolean;
}
