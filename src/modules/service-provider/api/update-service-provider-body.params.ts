import { ApiProperty } from '@nestjs/swagger';
import { ServiceProviderKategorie } from '../domain/service-provider.enum.js';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsDIN91379AEXT } from '../../../shared/util/din-91379-validation.js';

export class UpdateServiceProviderBodyParams {
    @ApiProperty({ required: false })
    @IsDIN91379AEXT()
    @MaxLength(50)
    @IsOptional()
    public name?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    public url?: string;

    @ApiProperty({
        required: false,
        enum: ServiceProviderKategorie,
    })
    @IsEnum(ServiceProviderKategorie)
    @IsOptional()
    public kategorie?: ServiceProviderKategorie;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    public nachtraeglichZuweisbar?: boolean;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    public verfuegbarFuerRollenerweiterung?: boolean;
}
