import { ApiProperty } from '@nestjs/swagger';
import { ServiceProviderKategorie, ServiceProviderMerkmal } from '../domain/service-provider.enum.js';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ALLOWED_LOGO_MIME_TYPES } from './allowed-mime-types.js';
import { IsDIN91379AEXT } from '../../../shared/util/din-91379-validation.js';

export class CreateServiceProviderBodyParams {
    @IsUUID()
    @ApiProperty({
        description: 'The id of an organization',
        required: true,
        nullable: false,
    })
    public organisationId!: string;

    @ApiProperty()
    @IsDIN91379AEXT()
    @MaxLength(50)
    public name!: string;

    @ApiProperty({ required: false })
    @IsOptional()
    public url?: string;

    @ApiProperty({
        required: false,
        description: 'Optional logo as base64-encoded string',
    })
    @IsOptional()
    public logoBase64?: string;

    @ApiProperty({
        required: false,
        enum: ALLOWED_LOGO_MIME_TYPES,
        example: 'image/png',
    })
    @IsOptional()
    @IsIn(ALLOWED_LOGO_MIME_TYPES)
    public logoMimeType?: string;

    @ApiProperty({ enum: ServiceProviderKategorie })
    @IsEnum(ServiceProviderKategorie)
    public kategorie!: ServiceProviderKategorie;

    @ApiProperty({ required: true })
    @IsBoolean()
    public requires2fa!: boolean;

    @ApiProperty({ enum: ServiceProviderMerkmal, isArray: true })
    @IsEnum(ServiceProviderMerkmal, { each: true })
    public merkmale!: ServiceProviderMerkmal[];
}
