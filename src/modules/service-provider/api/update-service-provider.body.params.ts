import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    ServiceProviderKategorie,
    ServiceProviderSystem,
    ServiceProviderTarget,
} from '../domain/service-provider.enum.js';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateServiceProviderBodyParams {
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'The name of the service-provider.',
    })
    public readonly name?: string;

    @IsEnum(ServiceProviderTarget)
    @IsOptional()
    @ApiPropertyOptional({
        description: 'The target of the service-provider.',
        enum: ServiceProviderTarget,
        enumName: 'ServiceProviderTarget',
    })
    public readonly target?: ServiceProviderTarget;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'The URL of the service-provider.',
    })
    public readonly url?: string;

    @IsEnum(ServiceProviderKategorie)
    @IsOptional()
    @ApiPropertyOptional({
        description: 'The category of the service-provider.',
        enum: ServiceProviderKategorie,
        enumName: 'ServiceProviderKategorie',
    })
    public readonly kategorie?: ServiceProviderKategorie;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'The reference to the Schulstrukturknoten.',
    })
    public readonly providedOnSchulstrukturknoten?: string;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'The logo of the service-provider as a base64 encoded string.',
    })
    public readonly logo?: string;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'The mime type of the logo.',
    })
    public readonly logoMimeType?: string;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'The keycloak group of the service-provider.',
    })
    public readonly keycloakGroup?: string;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'The keycloak role of the service-provider',
    })
    public readonly keycloakRole?: string;

    @IsEnum(ServiceProviderSystem)
    @IsOptional()
    @ApiPropertyOptional({
        description: 'The external system of the service-provider.',
        enum: ServiceProviderSystem,
        enumName: 'ServiceProviderSystem',
    })
    public readonly externalSystem?: ServiceProviderSystem;

    @IsBoolean()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'Indicates if the service-provider requires 2FA.',
    })
    public readonly requires2fa?: boolean;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional({
        description: 'The id of the vidis angebot of this service-provider',
    })
    public readonly vidisAngebotId?: string;
}
