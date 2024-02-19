import { AutoMap } from '@automapper/classes';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrganisationsTyp, Traegerschaft } from '../domain/organisation.enums.js';

export class CommonCreateUpdateOrganisationBodyParams {
    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiPropertyOptional()
    public readonly administriertVon?: string;

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

    @AutoMap(() => String)
    @IsEnum(OrganisationsTyp)
    @ApiProperty({ enum: OrganisationsTyp, required: true })
    public readonly typ!: OrganisationsTyp;

    @AutoMap(() => String)
    @IsEnum(Traegerschaft)
    @ApiProperty({ enum: Traegerschaft, required: false })
    @IsOptional()
    public traegerschaft?: Traegerschaft;
}
