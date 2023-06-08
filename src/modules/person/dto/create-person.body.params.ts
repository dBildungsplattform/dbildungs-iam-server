import { IsBoolean, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import { PersonGender, PersonTrustLevel } from '../person.enums.js';
import { PersonBirthParams } from './person-birth.params.js';
import { PersonNameParams } from './person-name.params.js';
import { AutoMap } from '@automapper/classes';

export class CreatePersonBodyParams {
    @AutoMap()
    @IsString()
    public readonly referrer!: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    public readonly mandant?: string;

    @AutoMap(() => PersonNameParams)
    @ValidateNested()
    public readonly name!: PersonNameParams;

    @AutoMap(() => PersonBirthParams)
    @ValidateNested()
    public readonly geburt!: PersonBirthParams;

    @AutoMap()
    @IsOptional()
    @IsString()
    @Matches(Object.values(PersonGender).join('|'))
    public readonly geschlecht?: PersonGender;

    @AutoMap()
    @IsOptional()
    @IsString()
    public readonly lokalisierung = 'de-DE';

    @AutoMap()
    @IsOptional()
    @IsString()
    @Matches(Object.values(PersonTrustLevel).join('|'))
    public readonly vertrauensstufe?: PersonTrustLevel;

    @AutoMap()
    @IsOptional()
    @IsBoolean()
    public readonly auskunftssperre?: boolean;
}
