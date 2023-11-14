import { AutoMap } from '@automapper/classes';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrganisationsTyp } from '../domain/organisation.enum.js';

export class CreateOrganisationBodyParams {
    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiPropertyOptional()
    public readonly verwaltetVon?: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiPropertyOptional()
    public readonly zugehoerigZu?: string;

    @AutoMap()
    @IsString()
    @ApiProperty({ required: true })
    public readonly kennung!: string;

    @AutoMap()
    @IsString()
    @ApiProperty({ required: true })
    public readonly name!: string;

    @AutoMap()
    @IsString()
    @ApiProperty({ required: true })
    public readonly namensergaenzung!: string;

    @AutoMap()
    @IsString()
    @ApiProperty({ required: true })
    public readonly kuerzel!: string;

    @AutoMap()
    @IsEnum(OrganisationsTyp)
    @ApiProperty({ enum: OrganisationsTyp, required: true })
    public readonly typ!: OrganisationsTyp;
}
