import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrganisationsTyp } from '../domain/organisation.enum.js';

export class CreateOrganisationBodyParams {
    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly kennung!: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly name!: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly namensergaenzung!: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly kuerzel!: string;

    @AutoMap()
    @IsOptional()
    @IsEnum(OrganisationsTyp)
    @ApiProperty({ name: 'type der organisation', enum: OrganisationsTyp, required: false })
    public readonly typ!: OrganisationsTyp;
}
