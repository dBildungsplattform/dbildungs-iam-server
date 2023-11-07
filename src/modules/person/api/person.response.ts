import { AutoMap } from '@automapper/classes';
import { PersonNameParams } from './person-name.params.js';
import { IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PersonBirthParams } from './person-birth.params.js';
import { Vertrauensstufe } from '../domain/person.enums.js';

export class PersonResponse {
    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty()
    public id!: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public referrer?: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @IsUUID()
    @ApiProperty({ required: true })
    public mandant: string = '';

    @AutoMap(() => PersonNameParams)
    @ValidateNested()
    @Type(() => PersonNameParams)
    @ApiProperty({ type: PersonNameParams, required: true })
    public name!: PersonNameParams;

    @AutoMap()
    @ValidateNested()
    @Type(() => PersonBirthParams)
    @ApiProperty({ type: PersonBirthParams, required: true })
    public geburt!: PersonBirthParams;

    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly stammorganisation?: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({ required: true })
    public geschlecht!: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({ required: true })
    public lokalisierung!: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({ enum: Vertrauensstufe, required: true })
    public vertrauensstufe!: Vertrauensstufe;
}
