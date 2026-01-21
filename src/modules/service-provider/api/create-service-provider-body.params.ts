import { ApiProperty } from '@nestjs/swagger';
import {
    ServiceProviderKategorie,
    ServiceProviderMerkmal,
    ServiceProviderTarget,
} from '../domain/service-provider.enum.js';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateServiceProviderBodyParams {
    @IsUUID()
    @ApiProperty({
        description: 'The id of an organization',
        required: true,
        nullable: false,
    })
    public organisationId!: string;

    @ApiProperty()
    @IsString()
    public name!: string;

    @ApiProperty({ enum: ServiceProviderTarget })
    @IsEnum(ServiceProviderTarget)
    public target!: ServiceProviderTarget;

    @ApiProperty({ required: false })
    @IsOptional()
    public url?: string;

    @ApiProperty({
        required: false,
        description: 'Optional logo as base64-encoded string',
    })
    @IsOptional()
    public logoBase64?: string;

    @ApiProperty({ enum: ServiceProviderKategorie })
    @IsEnum(ServiceProviderKategorie)
    public kategorie!: ServiceProviderKategorie;

    @ApiProperty({ required: true })
    @IsBoolean()
    public requires2fa!: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    public vidisAngebotId?: string;

    @ApiProperty({ enum: ServiceProviderMerkmal, isArray: true })
    @IsEnum(ServiceProviderMerkmal, { each: true })
    public merkmale!: ServiceProviderMerkmal[];
}
