import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Geschlecht, GeschlechtTypName, Vertrauensstufe, VertrauensstufeTypName } from '../domain/person.enums.js';
import { Person } from '../domain/person.js';
import { PersonBirthParams } from './person-birth.params.js';
import { PersonNameParams } from './person-name.params.js';

export class PersonInfoParams {
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly referrer?: string;

    @ValidateNested()
    @Type(() => PersonNameParams)
    @ApiProperty({ type: PersonNameParams, required: true })
    public readonly name!: PersonNameParams;

    @ValidateNested()
    @Type(() => PersonBirthParams)
    @ApiProperty({ type: PersonBirthParams, required: true })
    public readonly birth: PersonBirthParams;

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

    public constructor(person: Person<true>) {
        this.referrer = person.referrer;
        this.name = new PersonNameParams();
        this.birth = new PersonBirthParams(person.geburtsdatum);
        this.geschlecht = person.geschlecht;
        this.lokalisierung = person.lokalisierung;
        this.vertrauensstufe = person.vertrauensstufe;
    }
}
