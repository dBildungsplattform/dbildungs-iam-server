import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    ServiceProviderKategorie,
    ServiceProviderSystem,
    ServiceProviderTarget,
} from '../domain/service-provider.enum.js';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class ServiceProviderBodyParams {
    @IsString()
    @ApiProperty({
        description: 'The name of the service provider.',
        required: true,
    })
    public readonly name!: string;

    @IsEnum(ServiceProviderTarget)
    @ApiProperty({
        description: 'The target of the service provider.',
        required: true,
        enum: ServiceProviderTarget,
        enumName: 'ServiceProviderTarget',
    })
    public readonly target!: ServiceProviderTarget;

    @IsString()
    @ApiProperty({
        description: 'The URL of the service provider.',
        required: true,
    })
    public readonly url!: string;

    @IsEnum(ServiceProviderKategorie)
    @ApiProperty({
        description: 'The category of the service provider.',
        required: true,
        enum: ServiceProviderKategorie,
        enumName: 'ServiceProviderKategorie',
    })
    public readonly kategorie!: ServiceProviderKategorie;

    @IsString()
    @ApiProperty({
        description: 'The reference to the Schulstrukturknoten.',
        required: true,
    })
    public readonly providedOnSchulstrukturknoten!: string;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional()
    public readonly logo?: string;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional()
    public readonly logoMimeType?: string;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional()
    public readonly keycloakGroup?: string;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional()
    public readonly keycloakRole?: string;

    @IsEnum(ServiceProviderSystem)
    @ApiProperty({
        description: 'The external system of the service provider.',
        required: true,
        enum: ServiceProviderSystem,
        enumName: 'ServiceProviderSystem',
    })
    public readonly externalSystem!: ServiceProviderSystem;

    @IsBoolean()
    @ApiProperty({
        description: 'Indicates if the service provider requires 2FA.',
        required: true,
    })
    public readonly requires2fa!: boolean;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional()
    public readonly vidisAngebotId?: string;
}
